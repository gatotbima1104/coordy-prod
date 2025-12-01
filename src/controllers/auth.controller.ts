import { NextFunction, Request, Response } from "express";
import { APPLE_CLIENT_ID, JWT_SECRET_KEY, prisma, SMTP_PASS, SMTP_USER } from "../configs/config";
import { sendEmail } from "../utils/nodemailer.helper";
import { verifySupabaseToken } from "../utils/verifySupabase.helper";
import { signToken } from "../utils/jwt.helper";
import appleSignIn from "apple-signin-auth";
import crypto from "crypto";
import { supabaseClient } from "../configs/supabase.config";

export class AuthContoller {
    // async signInWithApple(req: Request, res: Response, next: NextFunction) {
    //     try {
            
    //         const { id_token, device_token } = req.body;
    //         if (!id_token) throw new Error("Missing Apple ID token")

    //         const decoded = await appleSignIn.verifyIdToken(id_token, {
    //             audience: APPLE_CLIENT_ID,
    //             ignoreExpiration: false,
    //         })

    //         const appleId = decoded.sub
    //         const email = decoded.email || ""

    //         const hashedAppleId = crypto.createHash('sha256').update(appleId).digest('hex');

    //         let user = await prisma.user.findUnique({
    //             where: { appleId: hashedAppleId }
    //         })

    //         if (!user) {
    //             user = await prisma.user.create({
    //                 data: {
    //                     appleId: hashedAppleId,
    //                     email
    //                 }
    //             })

    //             // SEND EMAIL IF IN THEIR FIRST LOGIN
    //             await sendEmail(
    //                 SMTP_USER,
    //                 SMTP_PASS,
    //                 user.email as string,
    //                 "REGISTER",
    //             )
    //         }

    //         if (device_token) {
    //             const existingDevice = await prisma.device.findUnique({
    //                 where: { token: device_token },
    //             });

    //             if (existingDevice) {
    //                 // Update user link if needed
    //                 if (existingDevice.userId !== user.id) {
    //                 await prisma.device.update({
    //                     where: { token: device_token },
    //                     data: { userId: user.id },
    //                 });
    //                 }
    //             } else {
    //                 // Create new device entry
    //                 await prisma.device.create({
    //                 data: {
    //                     token: device_token,
    //                     userId: user.id,
    //                 },
    //                 });
    //             }
    //         }


    //         const token = signToken({
    //             id: user.id,
    //             // appleId: user.appleId,
    //             email: user.email
    //         })

    //         res.status(200).send({
    //             success: true,
    //             token,
    //             user
    //         })


    //     } catch (error) {
    //         next(error)
    //     }
    // }

    async syncUser(req: Request, res: Response, next: NextFunction) {
        try {
            
            const authHeader = req.headers.authorization
            if (!authHeader) throw new Error("Missing Authorization header");

            const accessToken = authHeader.replace("Bearer ", "")
            console.log(accessToken)
            const payload = await verifySupabaseToken(accessToken)

            const supabaseId = payload.sub as string
            const email = req.body.email
            const deviceToken = req.body.device_token

            if (!email) throw new Error("Missing email");

            const existingUser = await prisma.user.findUnique({
                where: { supabaseId }
            });

            let user = await prisma.user.upsert({
                where: { supabaseId },
                update: { email },
                create: {
                    supabaseId,
                    email
                }
            })

            if (!existingUser && !email.includes("@privaterelay.appleid.com")) {
                await sendEmail(
                    SMTP_USER,
                    SMTP_PASS,
                    email,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    "REGISTER"
                );
            }

            if (deviceToken) {
                await prisma.device.upsert({
                    where: { token: deviceToken },
                    update: { userId: user.id },
                    create: {
                        token: deviceToken,
                        userId: user.id
                    }
                });
            }

            res.status(200).json({
                message: "success",
                data: user
            });

        } catch (error) {
            next(error)
        }
    }

    async deleteAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const supabaseId = req.user?.supabaseId
            const user = await prisma.user.findUnique({
                where: { supabaseId: supabaseId }
            })

            if (!user) throw new Error("User not found");
            // const supabaseId = user.supabaseId

            await prisma.user.delete({where: {supabaseId: supabaseId}})
            const {error} = await supabaseClient.auth.admin.deleteUser(supabaseId as string)
            if (error) throw new Error(error.message)

            res.status(200).send({
                message: "Account deleted successfully"
            })
        } catch (error) {
            next(error)
        }
    }
}