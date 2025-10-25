import { NextFunction, Request, Response } from "express";

export class AasaController{
    async signAasaApple(req: Request, res: Response, next: NextFunction) {
        try {
            
            const aasa = {
                applinks: {
                    apps: ["com.mario-panApp.Coordiy"],
                },
                appclips: {
                    apps: ["com.mario-panApp.Coordiy.Coordiy"]
                }
            }

            res.setHeader("Content-Type", "application/json");
            res.status(200).json(aasa);

        } catch (error) {
            next(error)
        }
    }   
}