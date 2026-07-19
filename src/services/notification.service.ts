import { NotificationRepository } from "../repositories/notification.repositories";
import { HttpError } from "../errors/http-error";
import { NotificationType } from "../types/notification.types";

const notificationRepository = new NotificationRepository();

export class NotificationService {
  /**
   * Create a notification and return it.
   */
  async createNotification(data: {
    recipientId: string;
    senderId?: string;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: {
      conversationId?: string;
      laptopId?: string;
      ratingId?: string;
      senderName?: string;
      senderImage?: string;
    };
  }) {
    return await notificationRepository.create({
      recipientId: data.recipientId,
      senderId: data.senderId,
      type: data.type,
      title: data.title,
      body: data.body,
      metadata: data.metadata,
    });
  }

  /**
   * Get paginated notifications for a user.
   */
  async getUserNotifications(
    userId: string,
    page: number,
    size: number,
    unreadOnly: boolean = false,
  ) {
    return await notificationRepository.findByRecipient(
      userId,
      page,
      size,
      unreadOnly,
    );
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string, userId: string) {
    const updated = await notificationRepository.markAsRead(notificationId, userId);
    if (!updated) {
      throw new HttpError("Notification not found", 404);
    }
    return updated;
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    await notificationRepository.markAllAsRead(userId);
    return { message: "All notifications marked as read" };
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string) {
    const count = await notificationRepository.getUnreadCount(userId);
    return { count };
  }

  /**
   * Delete a single notification.
   */
  async deleteNotification(notificationId: string, userId: string) {
    const deleted = await notificationRepository.deleteNotification(
      notificationId,
      userId,
    );
    if (!deleted) {
      throw new HttpError("Notification not found or not authorized", 404);
    }
    return { message: "Notification deleted successfully" };
  }
}
