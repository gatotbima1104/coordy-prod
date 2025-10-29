// @ts-nocheck
import { NextFunction, Request, Response } from "express";
import { prisma } from "../configs/config";
import { sendPushNotification } from "../utils/notification.helper";
import {
  findEventByShortSlug,
  findParticipantByShortSlug,
} from "../utils/slug.helper";

export class VoteController {
  async voteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { selectedTimes } = req.body;
      let { event, participant } = req.query;

      console.log("📩 Body:", req.body);
      console.log("📩 Query:", req.query);
      console.log("📩 URL:", req.originalUrl);

      // ✅ Extract slugs directly from path: /vote/<eventSlug>/<participantSlug>
      const parts = req.originalUrl.split("?")[0].split("/").filter(Boolean);
      if (parts.length >= 3) {
        event = parts[parts.length - 2];
        participant = parts[parts.length - 1];
      }

      console.log(`🔍 Parsed from path: event=${event}, participant=${participant}`);

      if (!event || !participant)
        throw new Error("Missing event or participant identifiers");

      // ✅ Find event (support both long and short slug)
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

      // ✅ Find participant using helper (handles both / and = endings)
      const participantExist = findParticipantByShortSlug(eventExist, participant as string);

      if (!participantExist) throw new Error("Participant not found");
      if (participantExist.status === "SUBMITTED")
        throw new Error("This voting link has expired or has already been used.");

      // ✅ 3. Proceed with voting transaction
      const transaction = await prisma.$transaction(async (tx) => {
        const updatedParticipant = await tx.participant.update({
          where: { id: participantExist.id },
          data: { selectedTimes, status: "SUBMITTED" },
        });

        const updatedEvent = await tx.event.findUnique({
          where: { id: eventExist.id },
          include: { participants: true },
        });
        if (!updatedEvent) throw new Error("Event not found after update");

        const availableTimes = updatedEvent.availableTimes.map((t) =>
          new Date(t).toISOString()
        );

        const matchedTimes = availableTimes.filter((avTime) =>
          updatedEvent.participants.every((p) =>
            (p.selectedTimes ?? [])
              .map((t) => new Date(t).toISOString())
              .includes(avTime)
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

        const owner = await tx.user.findUnique({
          where: { id: updatedEvent.userId },
          include: { devices: true },
        });

        if (owner?.devices?.length) {
          for (const device of owner.devices) {
            await sendPushNotification(
              device.token,
              "Participant responded",
              `${participantExist.name} has submitted their availability.`
            );
          }
        }

        await tx.notification.create({
          data: {
            title: "Participant responded",
            message: `${participantExist.name} has submitted their availability to ${updatedEvent.title}.`,
            status: "UNREAD",
            user: { connect: { id: owner!.id } },
            event: { connect: { id: updatedEvent.id } },
            type: "RESPONSE",
          },
        });

        return { updatedParticipant, matchedTimes, eventUpdate };
      });

      res.status(200).send({
        message: "success",
        data: transaction.updatedParticipant,
      });
    } catch (error) {
      console.error("❌ voteEvent error:", error);
      next(error);
    }
  }
}
