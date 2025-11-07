import { Router } from "express";
import { AiController } from "../controllers/ai.controller";

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: Public AI endpoints for scheduling intelligence and natural-language interpretation
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AiEvent:
 *       type: object
 *       description: Event context used for scheduling analysis
 *       properties:
 *         title:
 *           type: string
 *           example: UX Design Sprint
 *         notes:
 *           type: string
 *           example: Prototyping and design alignment session
 *         priority:
 *           type: string
 *           example: HIGH
 *         status:
 *           type: string
 *           example: WAITING_RESPONSE
 *         timezone:
 *           type: string
 *           example: Asia/Jakarta
 *         totalParticipants:
 *           type: integer
 *           example: 5
 *
 *     AiActivity:
 *       type: object
 *       description: User activity that can influence meeting time selection
 *       properties:
 *         name:
 *           type: string
 *           example: Morning Jog
 *         typicalTime:
 *           type: string
 *           example: 06:00-07:00
 *         type:
 *           type: string
 *           example: exercise
 *
 *     AiIntersectionRequest:
 *       type: object
 *       required: [event, matchedTimes]
 *       properties:
 *         event:
 *           $ref: '#/components/schemas/AiEvent'
 *         activities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AiActivity'
 *         matchedTimes:
 *           type: array
 *           items:
 *             type: string
 *             format: date-time
 *           example:
 *             - 2025-10-27T09:00:00Z
 *             - 2025-10-27T13:00:00Z
 *
 *     AiIntersectionResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: success
 *         data:
 *           type: array
 *           items:
 *             type: string
 *             format: date-time
 *           example:
 *             - 2025-10-27T09:00:00Z
 *             - 2025-10-27T13:00:00Z
 *
 *     AiInsightRequest:
 *       type: object
 *       required: [context]
 *       properties:
 *         context:
 *           type: string
 *           example: "Oke pak, saya bisa untuk tanggal 18 jam 08 ya"
 *
 *     AiInsightResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             intent:
 *               type: string
 *               example: confirm_availability
 *             event:
 *               type: string
 *               example: User Interview
 *             datetimes:
 *               type: array
 *               items:
 *                 type: string
 *                 format: date-time
 *               example:
 *                 - 2025-10-30T09:00:00.000Z
 *                 - 2025-10-30T12:00:00.000Z
 *             confidence:
 *               type: number
 *               example: 0.95
 *             rawText:
 *               type: string
 *               example: "Oke pak, saya bisa untuk tanggal 18 jam 08 ya"
 */

/**
 * @swagger
 * /ai/intersections:
 *   post:
 *     summary: Recommend best meeting intersection times (Public)
 *     tags: [AI]
 *     description: |
 *       Public endpoint — no authentication required.  
 *       Uses an AI model to analyze participants’ activities, matched availability, and event context  
 *       to suggest the most suitable meeting time(s).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AiIntersectionRequest'
 *     responses:
 *       200:
 *         description: Successfully returns recommended time(s)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AiIntersectionResponse'
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /ai/insight:
 *   post:
 *     summary: Interpret natural-language scheduling message (Public)
 *     tags: [AI]
 *     description: |
 *       Public endpoint — no authentication required.  
 *       Uses an AI model to extract structured scheduling intent, date, and time context  
 *       from free-form messages written in Indonesian or English.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AiInsightRequest'
 *     responses:
 *       200:
 *         description: Successfully parsed context
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AiInsightResponse'
 *       400:
 *         description: Missing or invalid context
 *       500:
 *         description: Internal server error
 */

export const aiRouter = () => {
  const router = Router();
  const aiRouter = new AiController();

  router.post("/intersections", aiRouter.recommendIntersectionTimes);
  router.post("/insight", aiRouter.getResponseContext);

  return router;
};
