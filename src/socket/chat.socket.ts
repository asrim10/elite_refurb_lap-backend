import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { UserRepository } from "../repositories/user.repositories";
import { ConversationRepository, MessageRepository } from "../repositories/chat.repositories";
import { MessageModel } from "../models/chat.model";
import { NotificationService } from "../services/notification.service";
import { emitNotification, emitUnreadCount } from "./notification.socket";

const userRepository = new UserRepository();
const conversationRepository = new ConversationRepository();
const messageRepository = new MessageRepository();
const notificationService = new NotificationService();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

/**
 * Safely extract a string ID from a Mongoose field that may be either:
 * - A plain string (unpopulated)
 * - A populated object with _id
 */
function getFieldId(field: any): string | undefined {
  if (!field) return undefined;
  if (typeof field === "object") {
    return field._id?.toString?.() ?? field.toString();
  }
  return field.toString();
}

export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // In production, restrict this to your frontend URL
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.query.token as string;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>;
      if (!decoded || !decoded.id) {
        return next(new Error("Invalid token"));
      }

      const user = await userRepository.getUserByID(decoded.id);
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (error) {
      return next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`User connected: ${userId}`);

    // Join a personal room for notifications
    socket.join(`user:${userId}`);

    // Join conversation room
    socket.on("join:conversation", async (conversationId: string) => {
      // Verify user is a participant
      const conversation = await conversationRepository.findById(conversationId);
      if (!conversation) {
        socket.emit("error", { message: "Conversation not found" });
        return;
      }

      const buyerId = getFieldId(conversation.buyerId);
      const sellerId = getFieldId(conversation.sellerId);

      if (buyerId !== userId && sellerId !== userId) {
        socket.emit("error", { message: "Not a participant" });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} joined conversation: ${conversationId}`);
    });

    // Leave conversation room
    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation: ${conversationId}`);
    });

    // Send message
    socket.on(
      "send:message",
      async (data: { conversationId: string; content: string; messageType?: string; fileUrl?: string }) => {
        try {
          const conversation = await conversationRepository.findById(
            data.conversationId,
          );
          if (!conversation) {
            socket.emit("error", { message: "Conversation not found" });
            return;
          }

          const buyerId = getFieldId(conversation.buyerId);
          const sellerId = getFieldId(conversation.sellerId);

          if (buyerId !== userId && sellerId !== userId) {
            socket.emit("error", { message: "Not a participant" });
            return;
          }

          // Determine unread field
          const isBuyer = buyerId === userId;
          const unreadField = isBuyer ? "sellerUnreadCount" : "buyerUnreadCount";

          // Create message in DB
          const message = await messageRepository.create({
            conversationId: data.conversationId,
            senderId: userId,
            content: data.content,
            messageType: (["text", "image", "file"].includes(data.messageType ?? "")
              ? data.messageType
              : "text") as "text" | "image" | "file",
            fileUrl: data.fileUrl,
          });

          // Update conversation
          await conversationRepository.updateLastMessage(
            data.conversationId,
            data.content,
            userId,
          );
          await conversationRepository.incrementUnread(
            data.conversationId,
            unreadField,
          );

          // Populate sender info
          const populatedMessage = await MessageModel.findById(message._id)
            .populate("senderId", "fullName email imageUrl");

          if (!populatedMessage) {
            socket.emit("error", { message: "Failed to load saved message" });
            return;
          }

          // Broadcast to all OTHER participants (exclude sender).
          // The sender already has the optimistic message locally and
          // doesn't need the server echo. This also prevents stale
          // senderId issues when the socket reconnects after switching
          // accounts.
          socket.broadcast.to(`conversation:${data.conversationId}`).emit(
            "new:message",
            populatedMessage.toObject(),
          );

          // Notify the other user's personal room
          const otherUserId = isBuyer ? sellerId : buyerId;

          if (otherUserId) {
            io.to(`user:${otherUserId}`).emit("conversation:updated", {
              conversationId: data.conversationId,
              lastMessage: data.content,
              lastMessageAt: new Date(),
              lastMessageSender: userId,
            });

            // Create an in-app notification for the other user
            try {
              const sender = await userRepository.getUserByID(userId);
              const senderName = sender?.fullName || sender?.email || "Someone";
              const senderImage = sender?.imageUrl;

              const notification = await notificationService.createNotification({
                recipientId: otherUserId,
                senderId: userId,
                type: "message",
                title: `New message from ${senderName}`,
                body: data.content.length > 100
                  ? data.content.substring(0, 100) + "..."
                  : data.content,
                metadata: {
                  conversationId: data.conversationId,
                  senderName,
                  senderImage,
                },
              });

              // Push notification in real-time (convert to plain object)
              emitNotification(io, otherUserId, notification.toObject());

              // Update unread count for the recipient
              const unreadResult = await notificationService.getUnreadCount(otherUserId);
              emitUnreadCount(io, otherUserId, unreadResult.count);
            } catch (err) {
              console.error("Failed to create notification:", err);
            }
          }
        } catch (error: any) {
          socket.emit("error", { message: error.message || "Failed to send message" });
        }
      },
    );

    // Mark as read
    socket.on("conversation:read", async (conversationId: string) => {
      try {
        const conversation = await conversationRepository.findById(conversationId);
        if (!conversation) return;

        const buyerId = getFieldId(conversation.buyerId);
        const sellerId = getFieldId(conversation.sellerId);
        const isBuyer = buyerId === userId;
        const unreadField = isBuyer ? "buyerUnreadCount" : "sellerUnreadCount";

        await conversationRepository.resetUnread(conversationId, unreadField);
        await messageRepository.markAsRead(conversationId, userId);

        io.to(`user:${userId}`).emit("conversation:read", {
          conversationId,
          readBy: userId,
        });
      } catch (error: any) {
        socket.emit("error", { message: error.message || "Failed to mark as read" });
      }
    });

    // Typing indicators
    socket.on("typing:start", (data: { conversationId: string }) => {
      socket
        .to(`conversation:${data.conversationId}`)
        .emit("typing:start", { conversationId: data.conversationId, userId });
    });

    socket.on("typing:stop", (data: { conversationId: string }) => {
      socket
        .to(`conversation:${data.conversationId}`)
        .emit("typing:stop", { conversationId: data.conversationId, userId });
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
}
