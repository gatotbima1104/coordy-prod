// @ts-nocheck

import { NextFunction, Request, Response } from "express";
import { prisma } from "../configs/config";
import { sendPushNotification, sendSilentNotification } from "../utils/notification.helper";
import { findEventByShortSlug, findParticipantByShortSlug } from "../utils/link.helper";


export class VoteController {
  async voteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { selectedTimes } = req.body;
      let { event, participant } = req.query;
      
      const parts = req.originalUrl.split("?")[0].split("/").filter(Boolean);

      // parse event and participant slugs
      if (parts.length >= 2) {
        event = parts[parts.length - 2];
        participant = parts[parts.length - 1];
      }

      if (!event || !participant) throw new Error("Missing event or participant identifiers");
      
      // Find event
      let eventExist = await prisma.event.findUnique({
        where: { slug: event as string },
        include: { participants: true },
      });

      if (!eventExist) {
        eventExist = await findEventByShortSlug(event as string);
        if (eventExist)
          eventExist = await prisma.event.findUnique({
            where: { id: eventExist.id },
            include: { participants: true },
          });
      }

      if (!eventExist) throw new Error("Event not found");

      // Find participant
      const participantExist = findParticipantByShortSlug(eventExist, participant as string);

      if (!participantExist) throw new Error("Participant not found");
      if (participantExist.status === "SUBMITTED") throw new Error("This voting link has expired or has already been used.");

      // Prepare for transaction
      const transactionResult = await prisma.$transaction(async (tx) => {
        
        // Update participant status
        const updatedParticipant = await tx.participant.update({
          where: { id: participantExist.id },
          data: { selectedTimes, status: "SUBMITTED" },
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

        const eventUpdate = await tx.event.update({
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

      // --- everything below runs AFTER transaction is closed ---

      // Fetch owner and send push notifications
    const owner = await prisma.user.findUnique({
      where: { id: transactionResult.ownerId },
      include: { devices: true },
    });

    if (owner?.devices?.length) {
      for (const device of owner.devices) {
        // Don't block transaction with network I/O
        sendPushNotification(
          device.token,
          "Participant responded",
          `${participantExist.name} has submitted their availability.`
        ).catch(console.error);

        // Send silent notification to update app data
        sendSilentNotification(device.token).catch(console.error);
      }
    }

    // Create notification separately
    await prisma.notification.create({
      data: {
        title: "Participant responded",
        message: `${participantExist.name} has submitted their availability to ${eventExist.title}.`,
        status: "UNREAD",
        user: { connect: { id: owner!.id } },
        event: { connect: { id: transactionResult.updatedEventId } },
        type: "RESPONSE",
      },
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
