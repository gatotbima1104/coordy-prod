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
   *   description: Manage user notifications
   */

  /**
   * @swagger
   * /notification:
   *   get:
   *     summary: Get all notifications for the authenticated user
   *     tags: [Notifications]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Successfully retrieved notifications
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
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         example: 5e8d6c83-7b6b-4c89-86a9-3e9baf62c123
   *                       title:
   *                         type: string
   *                         example: Participant responded
   *                       message:
   *                         type: string
   *                         example: John has submitted their availability to Project Sync.
   *                       status:
   *                         type: string
   *                         enum: [UNREAD, READ]
   *                       type:
   *                         type: string
   *                         example: RESPONSE
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   */
  router.get("/", verifyToken, notificationRouter.getNotifications);

  /**
   * @swagger
   * /notification/{id}:
   *   patch:
   *     summary: Update a notification’s status (e.g., mark as READ)
   *     tags: [Notifications]
   *     security:
   *       - BearerAuth: []
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
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [READ, UNREAD]
   *                 example: READ
   *     responses:
   *       200:
   *         description: Notification updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Notification marked as READ
   *       404:
   *         description: Notification not found
   */
  router.patch("/:id", verifyToken, notificationRouter.updateNotification);

  /**
   * @swagger
   * /notification/mark-all:
   *   patch:
   *     summary: Mark all unread notifications as read
   *     tags: [Notifications]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: All unread notifications marked as read
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Marked 3 notifications as READ
   */
  router.patch("/mark-all", verifyToken, notificationRouter.getNotifications);

  return router;
};
