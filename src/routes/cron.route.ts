import { Router } from "express";
import { CronController } from "../crons/event.cron";

export const cronRouter = () => {
  const router = Router();
  const cronController = new CronController();

  router.post("/deadline", cronController.cronEventExpiration);

  return router;
};