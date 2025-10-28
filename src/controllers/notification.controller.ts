import { NextFunction, Request, Response } from "express";
import { prisma } from "../configs/config";

export class NotificationController{
    async getNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            
            const userId = req.user?.id
            const data = await prisma.notification.findMany({
                where: {
                    userId
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
}