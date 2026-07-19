import {
  NotificationModel,
  INotification,
} from "../models/notification.model";

export interface INotificationRepository {
  create(data: Partial<INotification>): Promise<INotification>;
  findById(id: string): Promise<INotification | null>;
  findByRecipient(
    recipientId: string,
    page: number,
    size: number,
    unreadOnly?: boolean,
  ): Promise<{ notifications: INotification[]; total: number }>;
  markAsRead(id: string, recipientId: string): Promise<INotification | null>;
  markAllAsRead(recipientId: string): Promise<void>;
  getUnreadCount(recipientId: string): Promise<number>;
  deleteNotification(
    id: string,
    recipientId: string,
  ): Promise<INotification | null>;
}

export class NotificationRepository implements INotificationRepository {
  async create(data: Partial<INotification>): Promise<INotification> {
    const notification = new NotificationModel(data);
    return await notification.save();
  }

  async findById(id: string): Promise<INotification | null> {
    return await NotificationModel.findById(id);
  }

  async findByRecipient(
    recipientId: string,
    page: number,
    size: number,
    unreadOnly: boolean = false,
  ): Promise<{ notifications: INotification[]; total: number }> {
    const filter: Record<string, any> = { recipientId };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size),
      NotificationModel.countDocuments(filter),
    ]);

    return { notifications, total };
  }

  async markAsRead(
    id: string,
    recipientId: string,
  ): Promise<INotification | null> {
    return await NotificationModel.findOneAndUpdate(
      { _id: id, recipientId },
      { $set: { isRead: true } },
      { new: true },
    );
  }

  async markAllAsRead(recipientId: string): Promise<void> {
    await NotificationModel.updateMany(
      { recipientId, isRead: false },
      { $set: { isRead: true } },
    );
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    return await NotificationModel.countDocuments({
      recipientId,
      isRead: false,
    });
  }

  async deleteNotification(
    id: string,
    recipientId: string,
  ): Promise<INotification | null> {
    return await NotificationModel.findOneAndDelete({
      _id: id,
      recipientId,
    });
  }
}
