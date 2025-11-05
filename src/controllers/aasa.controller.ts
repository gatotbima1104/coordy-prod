import { NextFunction, Request, Response } from "express";

export class AasaController {
  async signAasaApple(req: Request, res: Response, next: NextFunction) {
    try {
      const aasa = {
        applinks: {
          apps: [],
          details: [
            {
              appID: "7WUR3QM973.com.mario-panApp.Coordiy",
              paths: ["/*"]
            }
          ]
        },
        appclips: {
          apps: ["7WUR3QM973.com.mario-panApp.Coordiy.Clip"]
        }
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.status(200).send(JSON.stringify(aasa));
    } catch (error) {
      next(error);
    }
  }
}
