import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { NotificationController } from "../controllers/notification.controller";

export const notificationRouter = () => {
  const router = Router();
  const notificationRouter = new NotificationController();

  router.get("/", verifyToken, notificationRouter.getNotifications);

  return router;
};
