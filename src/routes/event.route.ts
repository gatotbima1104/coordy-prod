import { Router } from "express";
import { EventController } from "../controllers/event.controller";
import { verifyToken } from "../middlewares/auth.middleware";

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Manage user events (create, read, update, delete)
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
 *           description: Title of the event
 *         notes:
 *           type: string
 *           description: Optional notes or description
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of the event
 *         status:
 *           type: string
 *           enum: [DRAFT, WAITING_RESPONSE, NEED_ACTION, COMPLETED]
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *         timezone:
 *           type: string
 *           example: [UTC, GMT, WIB, WITA, WIT, PST, EST, CET, JST, AEST]
 *         availableTimes:
 *           type: array
 *           items:
 *             type: string
 *             format: date-time
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
 *               email:
 *                 type: string
 *       example:
 *         title: "Team Sync"
 *         notes: "Weekly stand-up meeting"
 *         date: "2025-10-21T09:00:00.000Z"
 *         status: "DRAFT"
 *         priority: "LOW"
 *         timezone: "WIB"
 *         availableTimes: ["2025-10-22T09:00:00Z", "2025-10-23T10:00:00Z"]
 *         matchedTimes: []
 *         selectedTime: null
 *         participants: [{ "name": "John Doe", "email": "john@example.com" }]
 */

export const eventRouter = () => {
  const router = Router();
  const eventController = new EventController();

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
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Event'
   *       400:
   *         description: Invalid input
   */
  router.post("/", verifyToken, eventController.createEvent);

  /**
   * @swagger
   * /event:
   *   get:
   *     summary: Get all events for the authenticated user
   *     description: Retrieve all events created by the authenticated user. You can filter results by `name`, `status`, or specific date parts (`year`, `month`, `day`).
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: name
   *         in: query
   *         required: false
   *         description: Filter events whose title contains this text (case-insensitive)
   *         schema:
   *           type: string
   *           example: "meeting"
   *       - name: status
   *         in: query
   *         required: false
   *         description: Filter events by their status
   *         schema:
   *           type: string
   *           enum: [WAITING_RESPONSE, NEED_ACTION, COMPLETED]
   *           example: WAITING_RESPONSE
   *       - name: year
   *         in: query
   *         required: false
   *         description: Filter events created in a specific year
   *         schema:
   *           type: integer
   *           example: 2025
   *       - name: month
   *         in: query
   *         required: false
   *         description: Filter events created in a specific month (1–12)
   *         schema:
   *           type: integer
   *           example: 10
   *       - name: day
   *         in: query
   *         required: false
   *         description: Filter events created on a specific day of the month
   *         schema:
   *           type: integer
   *           example: 21
   *     responses:
   *       200:
   *         description: Successfully retrieved list of user events
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
   *                     $ref: '#/components/schemas/Event'
   *       400:
   *         description: Invalid query parameter (e.g., invalid status)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Invalid status value.
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
   *         description: Event ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Event found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Event'
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
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Event'
   *       400:
   *         description: Invalid input
   *       404:
   *         description: Event not found
   */
  router.patch("/:id", verifyToken, eventController.editEventById);
  
  /**
   * @swagger
   * /event/slug/{slug}:
   *   get:
   *     summary: Get an event by its slug
   *     tags: [Events]
   *     description: Retrieve a single event using its unique slug (human-readable identifier).
   *     parameters:
   *       - name: slug
   *         in: path
   *         required: true
   *         description: Unique slug identifier for the event (e.g., "team-sync-meeting").
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Event found successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Event'
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
   *         description: Unique ID of the event to update
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - selectedTime
   *             properties:
   *               selectedTime:
   *                 type: string
   *                 format: date-time
   *                 example: "2025-10-30T09:00:00.000Z"
   *     responses:
   *       200:
   *         description: Event time selected and marked as COMPLETED
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Event time selected successfully
   *                 data:
   *                   $ref: '#/components/schemas/Event'
   *       400:
   *         description: Missing or invalid input
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Event not found
   */
  router.patch("/:eventId/pick-time", verifyToken, eventController.pickTime);

  return router;
};