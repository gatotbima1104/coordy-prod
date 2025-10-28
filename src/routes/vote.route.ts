import { Router } from "express";
import { VoteController } from "../controllers/vote.controller";

/**
 * @swagger
 * tags:
 *   name: Votes
 *   description: Participant voting endpoints (time selection for events)
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
 *         selectedTimes: [
 *           "2025-10-22T09:00:00.000Z",
 *           "2025-10-22T11:00:00.000Z"
 *         ]
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
 *         updatedEvent:
 *           type: object
 *           description: Updated event object with participant selections
 */

export const voteRouter = () => {
  const router = Router();
  const voteController = new VoteController();

  /**
   * @swagger
   * /vote:
   *   post:
   *     summary: Submit participant votes for an event
   *     tags: [Votes]
   *     description: Allows a participant to submit selected time slots for a specific event.
   *     parameters:
   *       - name: eventSlug
   *         in: query
   *         required: true
   *         description: Unique slug of the event
   *         schema:
   *           type: string
   *           example: "weekly-team-meeting"
   *       - name: participantSlug
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
   *         description: Invalid input or missing parameters
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
   *     summary: Submit participant votes using short App Clip link
   *     tags: [Votes]
   *     description: Allows participants to submit votes using short links like /vote/b/a
   *     parameters:
   *       - name: eventLetter
   *         in: path
   *         required: true
   *         description: First letter of event slug
   *         schema:
   *           type: string
   *           example: "b"
   *       - name: participantLetter
   *         in: path
   *         required: true
   *         description: First letter of participant name
   *         schema:
   *           type: string
   *           example: "a"
   */
  router.post("/:eventLetter/:participantLetter", async (req, res, next) => {
    try {
      req.query.event = req.params.eventLetter;
      req.query.participant = req.params.participantLetter;
      await new VoteController().voteEvent(req, res, next);
    } catch (err) {
      next(err);
    }
  });

  return router;
};
