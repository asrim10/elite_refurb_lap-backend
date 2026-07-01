import {
  ConversationModel,
  IConversation,
  MessageModel,
  IMessage,
} from "../models/chat.model";

// Conversation Repository

export interface IConversationRepository {
  create(data: Partial<IConversation>): Promise<IConversation>;
  findById(id: string): Promise<IConversation | null>;
  findByLaptopAndBuyer(
    laptopId: string,
    buyerId: string,
  ): Promise<IConversation | null>;
  findByParticipant(
    userId: string,
    page: number,
    size: number,
  ): Promise<{ conversations: IConversation[]; total: number }>;
  updateLastMessage(
    id: string,
    content: string,
    senderId: string,
  ): Promise<IConversation | null>;
  incrementUnread(
    id: string,
    field: "buyerUnreadCount" | "sellerUnreadCount",
  ): Promise<void>;
  resetUnread(
    id: string,
    field: "buyerUnreadCount" | "sellerUnreadCount",
  ): Promise<void>;
  archive(id: string): Promise<IConversation | null>;
}

export class ConversationRepository implements IConversationRepository {
  async create(data: Partial<IConversation>): Promise<IConversation> {
    const conversation = new ConversationModel(data);
    return await conversation.save();
  }

  async findById(id: string): Promise<IConversation | null> {
    return await ConversationModel.findById(id)
      .populate("buyerId", "fullName email imageUrl phoneNumber")
      .populate("sellerId", "fullName email imageUrl phoneNumber")
      .populate("laptopId", "title brand modelName price images");
  }

  async findByLaptopAndBuyer(
    laptopId: string,
    buyerId: string,
  ): Promise<IConversation | null> {
    return await ConversationModel.findOne({
      laptopId,
      buyerId,
      status: "active",
    })
      .populate("buyerId", "fullName email imageUrl phoneNumber")
      .populate("sellerId", "fullName email imageUrl phoneNumber")
      .populate("laptopId", "title brand modelName price images");
  }

  async findByParticipant(
    userId: string,
    page: number,
    size: number,
  ): Promise<{ conversations: IConversation[]; total: number }> {
    const filter = {
      $or: [{ buyerId: userId }, { sellerId: userId }],
      status: "active",
    };

    const [conversations, total] = await Promise.all([
      ConversationModel.find(filter)
        .populate("buyerId", "fullName email imageUrl phoneNumber")
        .populate("sellerId", "fullName email imageUrl phoneNumber")
        .populate("laptopId", "title brand modelName price images")
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip((page - 1) * size)
        .limit(size),
      ConversationModel.countDocuments(filter),
    ]);

    return { conversations, total };
  }

  async updateLastMessage(
    id: string,
    content: string,
    senderId: string,
  ): Promise<IConversation | null> {
    return await ConversationModel.findByIdAndUpdate(
      id,
      {
        lastMessage: content,
        lastMessageAt: new Date(),
        lastMessageSender: senderId,
      },
      { new: true },
    );
  }

  async incrementUnread(
    id: string,
    field: "buyerUnreadCount" | "sellerUnreadCount",
  ): Promise<void> {
    await ConversationModel.findByIdAndUpdate(id, {
      $inc: { [field]: 1 },
    });
  }

  async resetUnread(
    id: string,
    field: "buyerUnreadCount" | "sellerUnreadCount",
  ): Promise<void> {
    await ConversationModel.findByIdAndUpdate(id, {
      $set: { [field]: 0 },
    });
  }

  async archive(id: string): Promise<IConversation | null> {
    return await ConversationModel.findByIdAndUpdate(
      id,
      { status: "archived" },
      { new: true },
    );
  }
}

// Message Repository

export interface IMessageRepository {
  create(data: Partial<IMessage>): Promise<IMessage>;
  findByConversation(
    conversationId: string,
    page: number,
    size: number,
  ): Promise<{ messages: IMessage[]; total: number }>;
  markAsRead(conversationId: string, userId: string): Promise<void>;
}

export class MessageRepository implements IMessageRepository {
  async create(data: Partial<IMessage>): Promise<IMessage> {
    const message = new MessageModel(data);
    return await message.save();
  }

  async findByConversation(
    conversationId: string,
    page: number,
    size: number,
  ): Promise<{ messages: IMessage[]; total: number }> {
    const filter = { conversationId };

    const [messages, total] = await Promise.all([
      MessageModel.find(filter)
        .populate("senderId", "fullName email imageUrl")
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size),
      MessageModel.countDocuments(filter),
    ]);

    return { messages, total };
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await MessageModel.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        readAt: { $exists: false },
      },
      { $set: { readAt: new Date() } },
    );
  }
}
