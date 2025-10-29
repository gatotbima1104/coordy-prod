import { Router } from "express";
import { AasaController } from "../controllers/aasa.controller";

export const aasaRouter = () => {
  const router = Router();
  const controller = new AasaController();

  // Apple expects EXACT path — no .json extension and in root domain
  // router.get("/.well-known/apple-app-site-association", controller.signAasaApple);
  router.get("/apple-app-site-association", controller.signAasaApple);

  return router;
};
