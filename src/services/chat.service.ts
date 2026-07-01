import { HttpError } from "../errors/http-error";
import {
  ConversationRepository,
  MessageRepository,
} from "../repositories/chat.repositories";
import { LaptopRepository } from "../repositories/laptop.repositories";
import { StartConversationDTO, SendMessageDTO } from "../dtos/chat.dto";

function getFieldId(field: any): string | undefined {
  if (!field) return undefined;
  if (typeof field === "object") {
    return field._id?.toString?.() ?? field.toString();
  }
  return field.toString();
}

const conversationRepository = new ConversationRepository();
const messageRepository = new MessageRepository();
const laptopRepository = new LaptopRepository();

export class ChatService {
  // Start or get existing conversation
  async startOrGetConversation(data: StartConversationDTO, buyerId: string) {
    if (buyerId === data.sellerId) {
      throw new HttpError("Cannot start a conversation with yourself", 400);
    }

    // Check if conversation already exists
    const existing = await conversationRepository.findByLaptopAndBuyer(
      data.laptopId,
      buyerId,
    );
    if (existing) {
      // Return existing conversation and save the initial message
      const message = await messageRepository.create({
        conversationId: existing._id.toString(),
        senderId: buyerId,
        content: data.initialMessage,
      });
      await conversationRepository.updateLastMessage(
        existing._id.toString(),
        data.initialMessage,
        buyerId,
      );
      await conversationRepository.incrementUnread(
        existing._id.toString(),
        "sellerUnreadCount",
      );
      return { conversation: existing, message };
    }

    // Verify laptop exists
    const laptop = await laptopRepository.getLaptopById(data.laptopId);
    if (!laptop) {
      throw new HttpError("Laptop not found", 404);
    }

    // Create new conversation
    const conversation = await conversationRepository.create({
      laptopId: data.laptopId,
      buyerId,
      sellerId: data.sellerId,
      lastMessage: data.initialMessage,
      lastMessageAt: new Date(),
      lastMessageSender: buyerId,
      sellerUnreadCount: 1,
    });

    // Create the first message
    const message = await messageRepository.create({
      conversationId: conversation._id.toString(),
      senderId: buyerId,
      content: data.initialMessage,
    });

    const populated = await conversationRepository.findById(
      conversation._id.toString(),
    );

    return { conversation: populated, message };
  }

  // Get user's conversations
  async getUserConversations(userId: string, page: number, size: number) {
    // Determine which unread field to include
    const result = await conversationRepository.findByParticipant(
      userId,
      page,
      size,
    );

    // Attach unread count based on user role in each conversation
    const conversationsWithUnread = result.conversations.map((conv) => {
      const isBuyer = conv.buyerId?.toString() === userId;
      return {
        ...conv.toObject(),
        unreadCount: isBuyer ? conv.buyerUnreadCount : conv.sellerUnreadCount,
      };
    });

    return { conversations: conversationsWithUnread, total: result.total };
  }

  // Get single conversation (must be participant)
  async getConversation(conversationId: string, userId: string) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new HttpError("Conversation not found", 404);
    }

    // Verify user is a participant
    const buyerId = getFieldId(conversation.buyerId);
    const sellerId = getFieldId(conversation.sellerId);
    if (buyerId !== userId && sellerId !== userId) {
      throw new HttpError("Not a participant of this conversation", 403);
    }

    return conversation;
  }

  // Get existing conversation for a laptop & buyer
  async getLaptopConversation(laptopId: string, buyerId: string) {
    const conversation = await conversationRepository.findByLaptopAndBuyer(
      laptopId,
      buyerId,
    );
    return conversation;
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    data: SendMessageDTO,
    senderId: string,
  ) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new HttpError("Conversation not found", 404);
    }

    // Verify sender is a participant
    const buyerId = getFieldId(conversation.buyerId);
    const sellerId = getFieldId(conversation.sellerId);
    if (buyerId !== senderId && sellerId !== senderId) {
      throw new HttpError("Not a participant of this conversation", 403);
    }

    // Determine who should get the unread increment
    const isBuyer = buyerId === senderId;
    const unreadField = isBuyer ? "sellerUnreadCount" : "buyerUnreadCount";

    // Create message
    const message = await messageRepository.create({
      conversationId,
      senderId,
      content: data.content,
      messageType: data.messageType,
      fileUrl: data.fileUrl,
    });

    // Update conversation last message
    await conversationRepository.updateLastMessage(
      conversationId,
      data.content,
      senderId,
    );

    // Increment unread count for the other party
    await conversationRepository.incrementUnread(conversationId, unreadField);

    return message;
  }

  // Get messages (paginated, newest first)
  async getMessages(
    conversationId: string,
    userId: string,
    page: number,
    size: number,
  ) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new HttpError("Conversation not found", 404);
    }

    // Verify user is a participant
    const buyerId = getFieldId(conversation.buyerId);
    const sellerId = getFieldId(conversation.sellerId);
    if (buyerId !== userId && sellerId !== userId) {
      throw new HttpError("Not a participant of this conversation", 403);
    }

    return await messageRepository.findByConversation(
      conversationId,
      page,
      size,
    );
  }

  // Mark conversation as read
  async markAsRead(conversationId: string, userId: string) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new HttpError("Conversation not found", 404);
    }

    const buyerId = getFieldId(conversation.buyerId);
    const isBuyer = buyerId === userId;
    const unreadField = isBuyer ? "buyerUnreadCount" : "sellerUnreadCount";

    // Reset unread count
    await conversationRepository.resetUnread(conversationId, unreadField);

    // Mark messages as read
    await messageRepository.markAsRead(conversationId, userId);

    return { success: true };
  }

  // Archive conversation
  async archiveConversation(conversationId: string, userId: string) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new HttpError("Conversation not found", 404);
    }

    const buyerId = getFieldId(conversation.buyerId);
    const sellerId = getFieldId(conversation.sellerId);
    if (buyerId !== userId && sellerId !== userId) {
      throw new HttpError("Not a participant of this conversation", 403);
    }

    await conversationRepository.archive(conversationId);
    return { message: "Conversation archived successfully" };
  }
}
