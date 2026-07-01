import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { UserRepository } from "../repositories/user.repositories";
import { ConversationRepository, MessageRepository } from "../repositories/chat.repositories";
import { MessageModel } from "../models/chat.model";

const userRepository = new UserRepository();
const conversationRepository = new ConversationRepository();
const messageRepository = new MessageRepository();

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

          // Emit to all participants in the conversation room
          io.to(`conversation:${data.conversationId}`).emit(
            "new:message",
            populatedMessage,
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

        io.to(`conversation:${conversationId}`).emit("conversation:read", {
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
