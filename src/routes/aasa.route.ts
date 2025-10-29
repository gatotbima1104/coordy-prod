// import { Router } from "express";
// import { AasaController } from "../controllers/aasa.controller";

// export const aasaRouter = () => {
//   const router = Router();
//   const controller = new AasaController();

//   // Apple expects EXACT path — no .json extension and in root domain
//   // router.get("/.well-known/apple-app-site-association", controller.signAasaApple);
//   router.get("/apple-app-site-association", controller.signAasaApple);

//   return router;
// };


import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";

export const aasaRouter = () => {
  const router = Router();

  router.get(
    ["/apple-app-site-association", "/.well-known/apple-app-site-association"],
    (req: Request, res: Response) => {
      try {
        const filePath = path.join(process.cwd(), "public", ".well-known", "apple-app-site-association");
        if (!fs.existsSync(filePath)) {
          return res.status(404).send("AASA file not found");
        }

        res.setHeader("Content-Type", "application/json");
        res.sendFile(filePath);
      } catch (err) {
        console.error("Error serving AASA:", err);
        res.status(500).send("Error serving AASA file");
      }
    }
  );

  return router;
};
