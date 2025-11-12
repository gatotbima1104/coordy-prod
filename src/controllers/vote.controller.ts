import { NextFunction, Request, Response } from "express";
import { prisma } from "../configs/config";
import { notifyUser } from "../utils/notification.helper";
import { findEventByShortSlug, findParticipantByShortSlug } from "../utils/link.helper";


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
        where: { slug: event as string },
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

          // TODO: NOTIF PARTICIPANT EMAIL
        }
        
        return res.status(403).send({
          message: `Voting closed at ${eventExist.expiredAt.toISOString()}`,
          data: "Event automatically marked as CANCELLED due to pending participants."
        });
      }

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
        if (allSubmitted) eventStatusUpdate.status = "NEED_ACTION";

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
