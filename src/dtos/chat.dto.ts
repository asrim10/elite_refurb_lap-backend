import z from "zod";

export const StartConversationDTO = z.object({
  laptopId: z.string().min(1, "Laptop ID is required"),
  sellerId: z.string().min(1, "Seller ID is required"),
  initialMessage: z.string().min(1).max(5000),
});

export type StartConversationDTO = z.infer<typeof StartConversationDTO>;

export const SendMessageDTO = z.object({
  content: z.string().min(1).max(5000),
  messageType: z.enum(["text", "image", "file"]).default("text"),
  fileUrl: z.string().optional(),
});

export type SendMessageDTO = z.infer<typeof SendMessageDTO>;

export const ConversationQueryDTO = z.object({
  page: z.coerce.number().positive().default(1),
  size: z.coerce.number().positive().max(50).default(20),
});

export type ConversationQueryDTO = z.infer<typeof ConversationQueryDTO>;

export const MessageQueryDTO = z.object({
  page: z.coerce.number().positive().default(1),
  size: z.coerce.number().positive().max(100).default(50),
});

export type MessageQueryDTO = z.infer<typeof MessageQueryDTO>;
