import z from "zod";

export const MessageTypeEnum = z.enum(["text", "image", "file"]);
export type MessageType = z.infer<typeof MessageTypeEnum>;

export const ConversationSchema = z.object({
  laptopId: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  lastMessage: z.string().optional(),
  lastMessageAt: z.date().optional(),
  lastMessageSender: z.string().optional(),
  buyerUnreadCount: z.number().default(0),
  sellerUnreadCount: z.number().default(0),
  status: z.enum(["active", "archived"]).default("active"),
});

export type ConversationType = z.infer<typeof ConversationSchema>;

export const MessageSchema = z.object({
  conversationId: z.string(),
  senderId: z.string(),
  content: z.string().min(1).max(5000),
  messageType: MessageTypeEnum.default("text"),
  fileUrl: z.string().optional(),
  readAt: z.date().optional(),
});

export type MessageTypeSchema = z.infer<typeof MessageSchema>;
