import { NextFunction, Request, Response } from "express";
import { APPLE_CLIENT_ID, JWT_SECRET_KEY, prisma } from "../config";
import appleSignIn from "apple-signin-auth";
import { signToken } from "../utils/jwt.helper";

export class AuthContoller {
    async signInWithApple(req: Request, res: Response, next: NextFunction) {
        try {
            
            const { id_token, device_token } = req.body;
            
            if (!id_token) throw new Error("Missing Apple ID token")

            const decoded = await appleSignIn.verifyIdToken(id_token, {
                audience: APPLE_CLIENT_ID,
                ignoreExpiration: false,
            })

            const appleId = decoded.sub
            const email = decoded.email || ""

            let user = await prisma.user.findUnique({
                where: { appleId }
            })

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        appleId,
                        email
                    }
                })
            }

            if (device_token) {
                await prisma.device.upsert({
                    where: {
                        token: device_token
                    },
                    update: {
                        userId: user.id
                    },
                    create: {
                        token: device_token, userId: user.id
                    }
                })
            }

            const token = signToken({
                id: user.id,
                appleId: user.appleId,
                email: user.email
            })

            res.status(200).send({
                success: true,
                token,
                user
            })


        } catch (error) {
            next(error)
        }
    }
}