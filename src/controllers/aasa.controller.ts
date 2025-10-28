import { NextFunction, Request, Response } from "express";

export class AasaController {
  async signAasaApple(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("hitted from aasa");

      const aasa = {
        applinks: {
            "applinks": {
                "apps": [],
                "details": [
                {
                    "appID": "7WUR3QM973.com.mario-panApp.Coordiy",
                    "paths": ["*"]
                }
                ]
            },
            "appclips": {
                "apps": ["7WUR3QM973.com.mario-panApp.Coordiy.Coordiy"]
            }
        }
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-cache");
      res.status(200).json(aasa);
    } catch (error) {
      next(error);
    }
  }
}
