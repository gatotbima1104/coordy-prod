// @ts-nocheck
import { NextFunction, Request, Response } from "express";
import { prisma } from "../configs/config";
import { sendPushNotification } from "../utils/notification.helper";

export class VoteController {
  async voteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      let { event, participant } = req.query;
      const { selectedTimes } = req.body;

      console.log("📩 Body:", req.body);
      console.log("📩 Query:", req.query);
      console.log("📩 URL:", req.originalUrl);

      // ✅ Extract event and participant directly from the path
      // e.g. /vote/p/a → event = "p", participant = "a"
      const parts = req.originalUrl.split("?")[0].split("/").filter(Boolean);
      if (parts.length >= 3) {
        event = parts[parts.length - 2];
        participant = parts[parts.length - 1];
      }

      console.log(`🔍 Parsed from path: event=${event}, participant=${participant}`);

      if (!event || !participant)
        throw new Error("Missing event or participant identifiers");

      // ✅ 1. Find event by its slug starting with the event letter
      const eventExist = await prisma.event.findFirst({
        where: { slug: { startsWith: event.toString() } },
        include: { participants: true },
      });
      if (!eventExist) throw new Error("Event not found");

      // ✅ 2. Find participant whose link ends with /<participant> or =<participant>
      const participantExist = eventExist.participants.find((p) => {
        const link = p.link.trim().toLowerCase();
        const slug = (participant as string).toLowerCase();
        return link.endsWith(`/${slug}`) || link.endsWith(`=${slug}`);
      });
      if (!participantExist) throw new Error("Participant not found");

      if (participantExist.status === "SUBMITTED")
        throw new Error("This voting link has expired or has already been used.");

      // ✅ 3. Proceed with existing transaction logic
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
