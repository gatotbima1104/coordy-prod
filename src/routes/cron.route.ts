import { Router } from "express";
import { CronController } from "../crons/event.cron";

export const cronRouter = () => {
  const router = Router();
  const cronController = new CronController();

  router.post("/deadline", cronController.cronEventExpiration);
  router.post("/delete", cronController.cronBulkDeleteExpirationEvents);

  return router;
};