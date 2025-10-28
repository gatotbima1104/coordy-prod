import { NextFunction, Request, Response } from "express";

export class AasaController {
  async signAasaApple(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("hitted from aasa");

      const aasa = {
        applinks: {
          apps: [],
          details: [
            {
              appID: "7WUR3QM973.com.mario-panApp.Coordiy",
              paths: ["*"] // You can restrict later to "/vote/*" if you want
            }
          ]
        },
        appclips: {
          apps: ["7WUR3QM973.com.mario-panApp.Coordiy.Coordiy"]
        }
      };

      // 🚨 Must not redirect or be cached, and must be served as pure JSON
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.status(200).send(aasa);
    } catch (error) {
      next(error);
    }
  }
}
