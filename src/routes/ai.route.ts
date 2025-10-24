import { Router } from "express";
import { AiController } from "../controllers/ai.controller";
import { verifyToken } from "../middlewares/auth.middleware";

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-based scheduling and natural-language interpretation
 */

/**
 * @swagger
 * /api/ai/intersections:
 *   post:
 *     summary: Recommend best meeting intersection times based on activities and matched availability
 *     description: >
 *       Uses an AI model to analyze participants' activities, matched availability, and event context 
 *       to suggest the best possible meeting time(s).
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: object
 *                 description: The event object including title, priority, participants, etc.
 *                 example:
 *                   title: "UX Design Sprint"
 *                   notes: "Prototyping and design alignment session"
 *                   priority: "HIGH"
 *                   status: "WAITING_RESPONSE"
 *                   timezone: "Asia/Jakarta"
 *                   totalParticipants: 5
 *               activities:
 *                 type: array
 *                 description: List of user activities that affect time preference.
 *                 example:
 *                   - name: "Morning Jog"
 *                     typicalTime: "06:00-07:00"
 *                     type: "exercise"
 *                   - name: "Lunch Break"
 *                     typicalTime: "12:00-13:00"
 *                     type: "meal"
 *               matchedTimes:
 *                 type: array
 *                 description: Matched available times between stakeholders and arranger.
 *                 example:
 *                   - "2025-10-27T09:00:00Z"
 *                   - "2025-10-27T13:00:00Z"
 *     responses:
 *       200:
 *         description: Successfully returns the best possible time(s)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "2025-10-27T09:00:00Z"
 *                     - "2025-10-27T13:00:00Z"
 *       400:
 *         description: Invalid request body
 */

/**
 * @swagger
 * /api/ai/insight:
 *   post:
 *     summary: Interpret user’s scheduling message and extract intent/date/time context
 *     description: >
 *       Uses an AI model to understand natural-language scheduling messages (in Indonesian or English)
 *       and extract structured intent, date, and time context.
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               context:
 *                 type: string
 *                 example: "Oke pak, saya bisa untuk tanggal 18 jam 08 ya"
 *     responses:
 *       200:
 *         description: Successfully parsed context
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     intent:
 *                       type: string
 *                       example: confirm_availability
 *                     event:
 *                       type: string
 *                       example: User Interview
 *                     date:
 *                       type: string
 *                       example: tanggal 18
 *                     time:
 *                       type: string
 *                       example: jam 08
 *                     confidence:
 *                       type: number
 *                       example: 0.95
 *                     rawText:
 *                       type: string
 *                       example: "Oke pak, saya bisa untuk tanggal 18 jam 08 ya"
 *       400:
 *         description: Missing or invalid context
 */

export const aiRouter = () => {
  const router = Router();
  const aiRouter = new AiController();

  router.post("/intersections", verifyToken, aiRouter.recommendIntersectionTimes);
  router.post("/insight", aiRouter.getResponseContext);

  return router;
};
