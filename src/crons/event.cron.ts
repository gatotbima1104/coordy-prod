import { NextFunction, Request, Response } from "express";
import { CRON_SECRET_KEY, prisma } from "../configs/config";
import { notifyUser } from "../utils/notification.helper";
import { Prisma } from "@prisma/client";

export class CronController {
    async cronEventExpiration(req: Request, res: Response, next: NextFunction) {
        try {
            
            const cronSecret = req.query.key
            if (cronSecret !== CRON_SECRET_KEY) {
                return res.status(403).send({
                    message: "Forbidden"
                })
            }

            const now = new Date()
            const eventExpired = await prisma.event.findMany({
                where: {
                    status: "WAITING_RESPONSE",
                    expiredAt: { lt: now }
                }, 
                include: { 
                    participants: true,
                    user: {
                        include: {
                            devices: true
                        }
                    }
                },
                orderBy: {
                    expiredAt: "asc"
                },
                take: 50
            })

            await prisma.event.updateMany({
                where: {
                    expiredAt: { lt: now },
                    status: "WAITING_RESPONSE"
                },
                data: {
                    status: "CANCELLED"
                }
            })
            
            // Send notify
            for (const event of eventExpired) {
                await notifyUser({
                    event,
                    type: "CRON",
                    totalParticipant: event.participants.filter(e => e.status == "PENDING").length
                })
            }

            res.status(200).send({
                message: "success",
                total: eventExpired.length,
                timestamp: now.toISOString()
            })

        } catch (error) {
            next(error)
        }
    }

    async cronBulkDeleteExpirationEvents(req: Request, res: Response, next: NextFunction) {
        try {

            const cronSecret = req.query.key
            if (cronSecret !== CRON_SECRET_KEY) {
                return res.status(403).send({
                    message: "Forbidden"
                })
            }

            const now = new Date()
            const weeklyTimes = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            const oldEvents = await prisma.event.findMany({
                where: {
                    date: { lt: weeklyTimes }
                },
                select: {
                    id: true,
                    title: true,
                    userId: true,
                    participants: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            })

            if(oldEvents.length == 0) {
                return res.status(200).send({
                    message: "nothing to delete",
                    total: 0,
                    weekStamp: weeklyTimes.toISOString(),
                    timestamp: now.toISOString()
                })
            }

            const archivedParticipants: Prisma.ArchivedParticipantCreateManyInput[] = []
            for (const event of oldEvents){
                for (const p of event.participants) {
                    if (p.email) {
                        archivedParticipants.push({
                            participantId: p.id,
                            eventId: event.id,
                            name: p.name,
                            email: p.email
                        })
                    }
                }
            }

            await prisma.archivedParticipant.createMany({
                data: archivedParticipants,
                skipDuplicates: true
            })

            const deletedEvents = await prisma.event.deleteMany({
                where: {
                    id: { in: oldEvents.map(e => e.id) }
                }
            })

            res.status(200).send({
                message: "success",
                archived: archivedParticipants.length,
                total: deletedEvents.count,
                weekStamp: weeklyTimes.toISOString(),
                timestamp: now.toISOString()
            })

        } catch (error) {
            next(error)
        }
    }
}