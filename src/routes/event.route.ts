import { Router } from "express";
import { EventController } from "../controllers/event.controller";
import { verifyToken } from "../middlewares/auth.middleware";

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Manage events — creation, editing, participant management, and retrieval
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - date
 *       properties:
 *         id:
 *           type: string
 *           description: Unique ID of the event
 *         title:
 *           type: string
 *           example: Team Sync
 *         notes:
 *           type: string
 *           example: Weekly stand-up meeting
 *         date:
 *           type: string
 *           format: date-time
 *           example: 2025-10-21T09:00:00.000Z
 *         status:
 *           type: string
 *           enum: [WAITING_RESPONSE, NEED_ACTION, COMPLETED]
 *           example: WAITING_RESPONSE
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *           example: LOW
 *         timezone:
 *           type: string
 *           example: WIB
 *         availableTimes:
 *           type: array
 *           items:
 *             type: string
 *             format: date-time
 *           example: ["2025-10-22T09:00:00Z", "2025-10-23T10:00:00Z"]
 *         matchedTimes:
 *           type: array
 *           items:
 *             type: string
 *             format: date-time
 *         selectedTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         participants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 */

/**
 * @swagger
 * /event:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Invalid input
 */
export const eventRouter = () => {
  const router = Router();
  const eventController = new EventController();

  router.post("/", verifyToken, eventController.createEvent);

  /**
   * @swagger
   * /api/event:
   *   get:
   *     summary: Get all events for the authenticated user
   *     description: Retrieve all events created by the authenticated user. Supports filtering by title, status, and date (year, month, day).
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: title
   *         schema:
   *           type: string
   *         description: Filter by event title (case-insensitive)
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [WAITING_RESPONSE, NEED_ACTION, COMPLETED]
   *         description: Filter by event status
   *       - in: query
   *         name: year
   *         schema:
   *           type: integer
   *         description: Filter by year (e.g. 2025)
   *       - in: query
   *         name: month
   *         schema:
   *           type: integer
   *         description: Filter by month (1–12)
   *       - in: query
   *         name: day
   *         schema:
   *           type: integer
   *         description: Filter by specific day of the month
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           minimum: 0
   *         description: The number of items to skip before starting to collect the result set
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: The number of items to return
   *     responses:
   *       200:
   *         description: Successfully retrieved events
   *       400:
   *         description: Invalid query parameter
   */
  router.get("/", verifyToken, eventController.getEvents);

  /**
   * @swagger
   * /event/{id}:
   *   get:
   *     summary: Get a single event by ID
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Event found
   *       404:
   *         description: Event not found
   */
  router.get("/:id", verifyToken, eventController.getEventById);

  /**
   * @swagger
   * /event/{id}:
   *   delete:
   *     summary: Delete an event by ID
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Event deleted successfully
   *       404:
   *         description: Event not found
   */
  router.delete("/:id", verifyToken, eventController.deteleEvent);

  /**
   * @swagger
   * /event/{id}:
   *   patch:
   *     summary: Update event details
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Event'
   *     responses:
   *       200:
   *         description: Event updated successfully
   *       404:
   *         description: Event not found
   */
  router.patch("/:id", verifyToken, eventController.editEventById);

  /**
   * @swagger
   * /event/slug/{slug}:
   *   get:
   *     summary: Get an event by its slug (Public)
   *     tags: [Events]
   *     description: |
   *       Public endpoint — no authentication required.  
   *       Used by App Clip or shared links to access an event without logging in.
   *     parameters:
   *       - name: slug
   *         in: path
   *         required: true
   *         description: Unique event slug (e.g., "team-sync-meeting")
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Event found successfully
   *       404:
   *         description: Event not found
   */
  router.get("/slug/:slug", eventController.getEventBySlug);

  /**
   * @swagger
   * /event/{eventId}/pick-time:
   *   patch:
   *     summary: Pick the final time for an event
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: eventId
   *         in: path
   *         required: true
   *         description: Event ID
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               selectedTime:
   *                 type: string
   *                 format: date-time
   *                 example: 2025-10-30T09:00:00.000Z
   *     responses:
   *       200:
   *         description: Event time selected and marked as COMPLETED
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Event not found
   */
  router.patch("/:eventId/pick-time", verifyToken, eventController.pickTime);

  return router;
};