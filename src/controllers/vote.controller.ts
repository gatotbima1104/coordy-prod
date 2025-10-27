// @ts-nocheck

import { NextFunction, Request, Response } from "express";
import { prisma } from "../configs/config";
import apn from "apn";

export class VoteController {

    async voteEvent(req: Request, res: Response, next: NextFunction) {
        try {
            
            const { eventSlug, participantSlug } = req.params
            const { selectedTimes } = req.body

            const event = await prisma.event.findUnique({
                where: {
                    slug: eventSlug,
                },
                include: {
                    participants: true
                }
            })

            if (!event) throw new Error("Event not found");

            const participant = event.participants.find(
                p => p.link.endsWith(`/${participantSlug}`)
            )
            if (!participant) throw new Error("Participant not found");
            if (participant.status == "SUBMITTED") throw new Error("This voting link has expired or has already been used.")

            const transaction = await prisma.$transaction(async (tx) => {
                const updatedParticipant = await tx.participant.update({
                    where: {
                        id: participant.id
                    },
                    data: {
                        selectedTimes,
                        status: "SUBMITTED"
                    }
                })


                const updatedEvent = await tx.event.findUnique({
                    where: {
                        id: event.id
                    },
                    include: {
                        participants: true
                    }
                })

                if(!updatedEvent) throw new Error("Event not found after update")

                const availableTimes = updatedEvent.availableTimes.map(t =>
                    new Date(t).toISOString()
                );

                const matchedTimes = availableTimes.filter(avTime =>
                    updatedEvent.participants.every(p =>
                        (p.selectedTimes ?? [])
                        .map(t => new Date(t).toISOString())
                        .includes(avTime)
                    )
                );

                const matchedDateObjs = matchedTimes.map(t => new Date(t));
                const eventUpdate = await tx.event.update({
                    where: { id: updatedEvent.id },
                    data: { matchedTimes: matchedDateObjs },
                });
                
                // Send notification participant responded
                const owner = await tx.user.findUnique({
                    where: {id: updatedEvent.userId},
                    include: {devices: true}
                })

                if (owner?.devices?.length) {
                    for (const device of owner.devices) {
                    await sendPushNotification(
                        device.token,
                        "Participant responded",
                        `${participant.name} has submitted their availability.`
                    );
                    }
                }

                
                return { updatedParticipant, matchedTimes: matchedTimes, eventUpdate}
            })

            res.status(200).send({
                message: "success",
                data: transaction.updatedParticipant,
                // matchedTimes: transaction.matchedTimes
            })
        } catch (error) {
            next(error)
        }
    }
}