import mongoose, { Document, Schema } from "mongoose";
import { ConversationType, MessageTypeSchema } from "../types/chat.types";

const ConversationSchema: Schema = new Schema<ConversationType>(
  {
    laptopId: {
      type: String,
      ref: "Laptop",
      required: true,
    },
    buyerId: {
      type: String,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: String,
      ref: "User",
      required: true,
    },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    lastMessageSender: { type: String, ref: "User" },
    buyerUnreadCount: { type: Number, default: 0 },
    sellerUnreadCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure one active conversation per buyer-laptop pair
ConversationSchema.index({ laptopId: 1, buyerId: 1, status: 1 });

export interface IConversation extends ConversationType, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const ConversationModel = mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema,
);

// Message Model

const MessageSchema: Schema = new Schema<MessageTypeSchema>(
  {
    conversationId: {
      type: String,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: String,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    fileUrl: { type: String },
    readAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export interface IMessage extends MessageTypeSchema, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);
