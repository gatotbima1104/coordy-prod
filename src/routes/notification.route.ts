import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { NotificationController } from "../controllers/notification.controller";

export const notificationRouter = () => {
  const router = Router();
  const notificationRouter = new NotificationController();

  /**
   * @swagger
   * tags:
   *   name: Notifications
   *   description: Authenticated endpoints to manage user notifications
   */

  /**
   * @swagger
   * components:
   *   schemas:
   *     NotificationStatus:
   *       type: string
   *       enum: [UNREAD, READ]
   *       example: UNREAD
   *
   *     Notification:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           example: 5e8d6c83-7b6b-4c89-86a9-3e9baf62c123
   *         title:
   *           type: string
   *           example: Participant responded
   *         message:
   *           type: string
   *           example: John has submitted their availability to Project Sync.
   *         status:
   *           $ref: '#/components/schemas/NotificationStatus'
   *         type:
   *           type: string
   *           example: RESPONSE
   *         createdAt:
   *           type: string
   *           format: date-time
   *         updatedAt:
   *           type: string
   *           format: date-time
   *
   *     NotificationListResponse:
   *       type: object
   *       properties:
   *         message:
   *           type: string
   *           example: success
   *         data:
   *           type: array
   *           items:
   *             $ref: '#/components/schemas/Notification'
   *
   *     NotificationUpdateRequest:
   *       type: object
   *       required:
   *         - status
   *       properties:
   *         status:
   *           $ref: '#/components/schemas/NotificationStatus'
   *       example:
   *         status: READ
   *
   *     NotificationSimpleResponse:
   *       type: object
   *       properties:
   *         message:
   *           type: string
   *           example: Notification marked as READ
   */

  /**
   * @swagger
   * /notification:
   *   get:
   *     summary: Get all notifications for the authenticated user
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     description: |
   *       Returns all notifications for the currently authenticated user,
   *       sorted by most recent first.
   *     responses:
   *       200:
   *         description: Successfully retrieved notifications
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/NotificationListResponse'
   *       401:
   *         description: Unauthorized – missing or invalid token
   *       500:
   *         description: Internal server error
   */
  router.get("/", verifyToken, notificationRouter.getNotifications);

  /**
   * @swagger
   * /notification/{id}:
   *   patch:
   *     summary: Update a notification’s status (e.g., mark as READ)
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     description: |
   *       Allows the authenticated user to update a specific notification's status,
   *       typically marking it as READ or UNREAD.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Notification ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NotificationUpdateRequest'
   *     responses:
   *       200:
   *         description: Notification updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/NotificationSimpleResponse'
   *       401:
   *         description: Unauthorized – missing or invalid token
   *       404:
   *         description: Notification not found
   *       500:
   *         description: Internal server error
   */
  router.patch("/:id", verifyToken, notificationRouter.updateNotification);
  router.get("/calendar/:id", notificationRouter.addToCalendar);

  /**
   * @swagger
   * /notification/mark-all:
   *   patch:
   *     summary: Mark all unread notifications as READ
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     description: Marks all notifications with status `UNREAD` as `READ` for the authenticated user.
   *     responses:
   *       200:
   *         description: All unread notifications marked as READ
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Marked 3 notifications as READ
   *       401:
   *         description: Unauthorized – missing or invalid token
   *       500:
   *         description: Internal server error
   */
  router.patch("/mark-all", verifyToken, notificationRouter.markAllAsRead);
  return router;
};
