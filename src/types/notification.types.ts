import z from "zod";

export const NotificationTypeEnum = z.enum([
  "message",
  "chat_request",
  "rating",
  "wishlist",
  "listing_update",
  "system",
]);
export type NotificationType = z.infer<typeof NotificationTypeEnum>;

export const NotificationMetadataSchema = z.object({
  conversationId: z.string().optional(),
  laptopId: z.string().optional(),
  ratingId: z.string().optional(),
  senderName: z.string().optional(),
  senderImage: z.string().optional(),
});

export type NotificationMetadata = z.infer<typeof NotificationMetadataSchema>;

export const NotificationSchema = z.object({
  recipientId: z.string(),
  senderId: z.string().optional(),
  type: NotificationTypeEnum,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  metadata: NotificationMetadataSchema.optional(),
  isRead: z.boolean().default(false),
});

export type NotificationTypeSchema = z.infer<typeof NotificationSchema>;

export const NotificationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(20),
  unreadOnly: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
});

export type NotificationQueryType = z.infer<typeof NotificationQuerySchema>;
