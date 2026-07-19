import { Router } from "express";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { NotificationController } from "../controllers/notification.controller";

const notificationController = new NotificationController();
const router = Router();

// All notification routes require authentication
router.use(authorizedMiddleware);

// GET /api/notifications - Get paginated notifications
router.get("/", notificationController.getNotifications.bind(notificationController));

// GET /api/notifications/unread-count - Get unread count
router.get(
  "/unread-count",
  notificationController.getUnreadCount.bind(notificationController),
);

// PATCH /api/notifications/read-all - Mark all as read
router.patch(
  "/read-all",
  notificationController.markAllAsRead.bind(notificationController),
);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch(
  "/:id/read",
  notificationController.markAsRead.bind(notificationController),
);

// DELETE /api/notifications/:id - Delete a notification
router.delete(
  "/:id",
  notificationController.deleteNotification.bind(notificationController),
);

export default router;
