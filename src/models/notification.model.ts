import mongoose, { Document, Schema } from "mongoose";
import { NotificationTypeSchema } from "../types/notification.types";

const NotificationSchema: Schema = new Schema<NotificationTypeSchema>(
  {
    recipientId: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "message",
        "chat_request",
        "rating",
        "wishlist",
        "listing_update",
        "system",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      maxlength: 500,
    },
    metadata: {
      conversationId: { type: String },
      laptopId: { type: String },
      ratingId: { type: String },
      senderName: { type: String },
      senderImage: { type: String },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient queries
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export interface INotification extends NotificationTypeSchema, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationModel = mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);
