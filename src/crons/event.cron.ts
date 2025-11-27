import { NextFunction, Request, Response } from "express";
import { CRON_SECRET_KEY, prisma } from "../configs/config";
import { sendCronJonNotif } from "../utils/notification.helper";

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
                }
            })

            await prisma.event.updateMany({
                where: {
                    expiredAt: { lt: now },
                    status: "WAITING_RESPONSE"
                },
                data: {
                    status: "CANCELLED",
                    isDeleted: true
                }
            })
            
            // Send silent notify
            for (const event of eventExpired) {
                const devices = event.user.devices
                devices.forEach( async (i) => {
                    await sendCronJonNotif(
                        i.token
                    )
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
}