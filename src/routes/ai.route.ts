import { Router } from "express";
import { AiController } from "../controllers/ai.controller";
import { verifyToken } from "../middlewares/auth.middleware";

export const aiRouter = () => {
  const router = Router();
  const aiRouter = new AiController();

  router.post("/intersections", verifyToken, aiRouter.recommendIntersectionTimes);
  router.post("/insight", aiRouter.getResponseContext);

  return router;
};
