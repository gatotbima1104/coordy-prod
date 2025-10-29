import { NextFunction, Request, Response } from "express";
import { prisma } from "../configs/config";

export class NotificationController{
    async getNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id
            const data = await prisma.notification.findMany({
                where: {
                    userId
                },
                orderBy: {
                    createdAt: "desc"
                }
            })

            res.status(200).send({
                message: "success",
                data
            })

        } catch (error) {
            next(error)
        }
    }
    
    async updateNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id
            const { id } = req.params
            const { status } = req.body

            if (!userId) throw new Error("Unauthorized");
            if (!id) throw new Error("Notification ID is required");
            if (!status) throw new Error("Status is required");

            const updated = await prisma.notification.updateMany({
                where: {
                    id,
                    userId,
                },
                data: {
                    status,
                },
            });

            if (updated.count === 0) {
                return res.status(404).json({ message: "Notification not found" });
            }

            res.status(200).send({
                message: `Notification marked as ${status}`,
            });

        } catch (error) {
            next(error)
        }
    }

    async markAllAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) throw new Error("Unauthorized");

            const result = await prisma.notification.updateMany({
                where: {
                    userId,
                    status: "UNREAD",
                },
                data: {
                    status: "READ",
                },
            });

            res.status(200).send({
                message: `Marked ${result.count} notifications as READ`,
            });
        } catch (error) {
            next(error);
        }
    }
}