import { Router } from "express";
import { VoteController } from "../controllers/vote.controller";

/**
 * @swagger
 * tags:
 *   name: Votes
 *   description: Public endpoints for participant voting (no authentication required)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     VoteRequest:
 *       type: object
 *       required:
 *         - selectedTimes
 *       properties:
 *         selectedTimes:
 *           type: array
 *           items:
 *             type: string
 *             format: date-time
 *           description: List of time slots chosen by the participant
 *       example:
 *         selectedTimes:
 *           - "2025-10-22T09:00:00.000Z"
 *           - "2025-10-22T11:00:00.000Z"
 *
 *     VoteResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Vote submitted successfully"
 *         matchedTimes:
 *           type: array
 *           items:
 *             type: string
 *             format: date-time
 *           description: Times matched across all participants
 *         updatedParticipant:
 *           type: object
 *           description: Updated participant details after submission
 */

export const voteRouter = () => {
  const router = Router();
  const voteController = new VoteController();

  /**
   * @swagger
   * /vote:
   *   post:
   *     summary: Submit participant votes for an event (Public)
   *     tags: [Votes]
   *     description: |
   *       Allows participants to submit selected time slots for an event using query parameters.
   *       This endpoint does **not** require authentication.
   *     parameters:
   *       - name: event
   *         in: query
   *         required: true
   *         description: Unique slug of the event
   *         schema:
   *           type: string
   *           example: "weekly-team-meeting"
   *       - name: participant
   *         in: query
   *         required: true
   *         description: Unique slug for the participant
   *         schema:
   *           type: string
   *           example: "john-doe"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/VoteRequest'
   *     responses:
   *       200:
   *         description: Vote submitted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/VoteResponse'
   *       400:
   *         description: Invalid input or already submitted
   *       404:
   *         description: Event or participant not found
   *       500:
   *         description: Internal server error
   */
  router.post("/", voteController.voteEvent);

  /**
   * @swagger
   * /vote/{eventLetter}/{participantLetter}:
   *   post:
   *     summary: Submit votes via short App Clip link (Public)
   *     tags: [Votes]
   *     description: |
   *       Allows participants to submit votes via compact short links such as `/vote/b/a`.
   *       This endpoint also does **not** require authentication.
   *     parameters:
   *       - name: eventLetter
   *         in: path
   *         required: true
   *         description: Short slug representing the event
   *         schema:
   *           type: string
   *           example: "b"
   *       - name: participantLetter
   *         in: path
   *         required: true
   *         description: Short slug representing the participant
   *         schema:
   *           type: string
   *           example: "a"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/VoteRequest'
   *     responses:
   *       200:
   *         description: Vote submitted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/VoteResponse'
   *       400:
   *         description: Invalid input or already submitted
   *       404:
   *         description: Event or participant not found
   *       500:
   *         description: Internal server error
   */
  router.post("/:eventLetter/:participantLetter", (req, res, next) => {
    req.query.event = req.params.eventLetter;
    req.query.participant = req.params.participantLetter;
    voteController.voteEvent(req, res, next);
  });

  return router;
};
