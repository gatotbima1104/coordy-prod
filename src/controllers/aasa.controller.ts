import { NextFunction, Request, Response } from "express";

export class AasaController{
    async signAasaApple(req: Request, res: Response, next: NextFunction) {
        try {
            
            const aasa = {
                applinks: {
                    apps: ["7WUR3QM973.com.mario-panApp.Coordiy"],
                },
                appclips: {
                    apps: ["7WUR3QM973.com.mario-panApp.Coordiy.Coordiy"]
                }
            }

            res.setHeader("Content-Type", "application/json");
            res.status(200).json(aasa);

        } catch (error) {
            next(error)
        }
    }   
}