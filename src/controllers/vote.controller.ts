import { NextFunction, Request, Response } from "express";
import { prisma, SMTP_PASS, SMTP_USER } from "../configs/config";
import { notifyUser } from "../utils/notification.helper";
import { findEventByShortSlug, findParticipantByShortSlug } from "../utils/link.helper";
import { formatEventDateTime } from "../utils/time.helper";
import { sendEmail } from "../utils/nodemailer.helper";


export class VoteController {
  async voteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, selectedTimes } = req.body;
      let { e, i, event, participant } = req.query;

      // PARAMS CHECK
      event = event || e;
      participant = participant || i;

      const parts = req.originalUrl.split("?")[0].split("/").filter(Boolean)
      if (parts.length >= 2) {
        event = event ?? parts[parts.length - 2]
        participant = participant ?? parts[parts.length - 1]
      }
      
      // VALIDATION PARAMS
      if (!event || !participant) throw new Error("Missing event or participant identifiers");
      
      // Find event by slug
      let eventExist = await prisma.event.findUnique({
        where: { slug: event as string, isDeleted: false },
        include: { participants: true },
      });

      // Not found by slug
      if (!eventExist) {
        const shortEvent = await findEventByShortSlug(event as string);
        if (shortEvent) {
          eventExist = await prisma.event.findUnique({
            where: { id: shortEvent.id },
            include: { participants: true },
          });
        }
      }

      if (!eventExist) throw new Error("Event not found");
      if (["CANCELLED", "COMPLETED"].includes(eventExist.status)) {
        return res.status(403).json({
          message: `Voting is closed. Event status: ${eventExist.status}`,
        });
      }

      // EXPIRED CHECK
      const now = new Date();
      if (eventExist.expiredAt && now > eventExist.expiredAt) {
        const hasPending = eventExist.participants.some(
          (p) => p.status === "PENDING"
        )
        if (hasPending) {
          await prisma.event.update({
            where: { id: eventExist.id },
            data: { status: "CANCELLED" },
          });

          // NOTIFICATION
          await notifyUser({
            event: eventExist,
            type: "CANCELLED",
          });

          const participantEmails = await prisma.participant.findMany({
            where: {
              eventId: eventExist.id,
              NOT: {
                email: null
              }
            },
            select: {
              email: true
            }
          })

          // SEND EMAIL NOTIF
          const { formattedDate, formattedTime } = formatEventDateTime(eventExist.date)
          for (const p of participantEmails) {
            await sendEmail(
              SMTP_USER,
              SMTP_PASS,
              p.email as string,
              eventExist.title as string,
              formattedDate,
              eventExist.location,
              formattedTime,
              "CANCELLED",
            )
          }
        }
        
        return res.status(403).send({
          message: `Voting closed at ${eventExist.expiredAt.toISOString()}`,
          data: "Event automatically marked as CANCELLED due to pending participants."
        });
      }

      let shouldNotifyNeedAction = false;
      let needActionEventPayload: any = null;
      let shouldNotifyNonMatching = false;
      let nonMatchingEventPayload: any = null;

      // Find participant
      const participantExist = findParticipantByShortSlug(eventExist, participant as string);
      if (!participantExist) throw new Error("Participant not found");

      // TRANSACTION
      const transactionResult = await prisma.$transaction(async (tx) => {

        // Update participant status
        const updatedParticipant = await tx.participant.update({
          where: { id: participantExist.id },
          data: { selectedTimes, status: "SUBMITTED", email },
        });

        // Re-fetch event with participants
        const updatedEvent = await tx.event.findUnique({
          where: { id: eventExist.id },
          include: { participants: true },
        });

        if (!updatedEvent) throw new Error("Event not found after update");

        // Calculate matched times that all submitted
        const submittedParticipants = updatedEvent.participants.filter(
          (p) => p.status === "SUBMITTED" || p.id === participantExist.id
        );

        const availableTimes = updatedEvent.availableTimes.map((t) => new Date(t).toISOString());
        const matchedTimes = availableTimes.filter((avTime) =>
          submittedParticipants.every((p) =>
            (p.selectedTimes ?? []).map((t) => new Date(t).toISOString()).includes(avTime)
          )
        );

        const matchedDateObjs = matchedTimes.map((t) => new Date(t));
        const allSubmitted = updatedEvent.participants.every(
          (p) => p.status === "SUBMITTED" || p.id === participantExist.id
        );

        const eventStatusUpdate: any = { matchedTimes: matchedDateObjs };

        // Handle if all submitted and there is at least one matched time
        if (allSubmitted && matchedDateObjs.length >= 1) {
          eventStatusUpdate.status = "NEED_ACTION";
          shouldNotifyNeedAction = true;
          needActionEventPayload = {
            ...updatedEvent,
            matchedTimes: matchedDateObjs,
          };
        } else if (allSubmitted && matchedDateObjs.length === 0) {
          eventStatusUpdate.status = "CANCELLED";
          eventStatusUpdate.isDeleted = true;
          shouldNotifyNonMatching = true;
          nonMatchingEventPayload = {
            ...updatedEvent,
            matchedTimes: matchedDateObjs,
          };
        } else {
          eventStatusUpdate.status = "WAITING_RESPONSE";
        }

        await tx.event.update({
          where: { id: updatedEvent.id },
          data: eventStatusUpdate,
        });

        return {
          updatedParticipant,
          updatedEventId: updatedEvent.id,
          ownerId: updatedEvent.userId,
          matchedTimes,
        };
      });

      // NOTIFICATIONS RESPONSE
      const isFirstSubmit = participantExist.status == "PENDING"
      await notifyUser({
        event: eventExist,
        participant: participantExist,
        isFirstSubmit,
        type: "RESPONSE",
      });

      if (shouldNotifyNeedAction && needActionEventPayload) {
        await notifyUser({
          event: needActionEventPayload,
          type: "REMINDER",
        });
      }

      if (shouldNotifyNonMatching && nonMatchingEventPayload) {
        await notifyUser({
          event: nonMatchingEventPayload,
          type: "NONMATCHING",
        });
      }
      
      res.status(200).send({
        message: "success",
        data: transactionResult.updatedParticipant,
      });

    } catch (error) {
      console.error("❌ voteEvent error:", error);
      const message = error instanceof Error ? error.message : "Unexpected server error";
      res.status(400).json({
        data: "success",
        message,
      });
    }
  }
}
