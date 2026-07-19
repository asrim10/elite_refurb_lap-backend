import { Server, Socket } from "socket.io";
import { NotificationService } from "../services/notification.service";

const notificationService = new NotificationService();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

/**
 * Emit a notification to a specific user in real-time.
 * This is called from anywhere (chat socket, controllers, etc.)
 * to push notifications live to connected clients.
 */
export function emitNotification(
  io: Server,
  recipientId: string,
  notification: any,
) {
  io.to(`user:${recipientId}`).emit("notification:new", notification);
}

/**
 * Emit updated unread count to a user.
 */
export function emitUnreadCount(io: Server, recipientId: string, count: number) {
  io.to(`user:${recipientId}`).emit("notification:unread", { count });
}

/**
 * Initialize notification-specific socket listeners.
 * Called from the main app after the io server is created.
 */
export function initializeNotificationSocket(io: Server) {
  // Notification events are handled reactively.
  // The server emits "notification:new" and "notification:unread"
  // to the user's room (user:<userId>) whenever a notification is created.
  //
  // Users can also request the unread count manually and mark notifications as read.
  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    // Join personal notification room (already done in chat.socket.ts's io.use,
    // but we ensure it here as well if the chat socket init handles it).
    socket.join(`user:${userId}`);

    // Request unread count manually
    socket.on("notification:getUnreadCount", async () => {
      try {
        const result = await notificationService.getUnreadCount(userId);
        socket.emit("notification:unread", result);
      } catch (error: any) {
        socket.emit("error", { message: error.message || "Failed to get unread count" });
      }
    });

    // Mark a single notification as read from socket
    socket.on("notification:markRead", async (notificationId: string) => {
      try {
        await notificationService.markAsRead(notificationId, userId);
        // Update unread count after marking as read
        const result = await notificationService.getUnreadCount(userId);
        io.to(`user:${userId}`).emit("notification:unread", result);
      } catch (error: any) {
        socket.emit("error", { message: error.message || "Failed to mark notification as read" });
      }
    });

    // Mark all notifications as read from socket
    socket.on("notification:markAllRead", async () => {
      try {
        await notificationService.markAllAsRead(userId);
        socket.emit("notification:unread", { count: 0 });
      } catch (error: any) {
        socket.emit("error", { message: error.message || "Failed to mark all as read" });
      }
    });

    // Disconnect is handled by the main chat socket
  });
}
