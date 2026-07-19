import { Request, Response } from "express";
import z from "zod";
import { NotificationService } from "../services/notification.service";
import { NotificationQuerySchema } from "../types/notification.types";

const notificationService = new NotificationService();

export class NotificationController {
  /**
   * GET /api/notifications
   * Get paginated notifications for the authenticated user.
   */
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const parsedQuery = NotificationQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const { notifications, total } =
        await notificationService.getUserNotifications(
          userId,
          parsedQuery.data.page,
          parsedQuery.data.size,
          parsedQuery.data.unreadOnly,
        );

      return res.status(200).json({
        success: true,
        data: notifications,
        total,
        page: parsedQuery.data.page,
        size: parsedQuery.data.size,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Get unread notification count for the authenticated user.
   */
  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const result = await notificationService.getUnreadCount(userId);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read.
   */
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const notification = await notificationService.markAsRead(
        req.params.id as string,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: notification,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read for the authenticated user.
   */
  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const result = await notificationService.markAllAsRead(userId);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Delete a single notification.
   */
  async deleteNotification(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const result = await notificationService.deleteNotification(
        req.params.id as string,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
