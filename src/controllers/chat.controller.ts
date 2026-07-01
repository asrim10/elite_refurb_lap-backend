import { Request, Response } from "express";
import z from "zod";
import { ChatService } from "../services/chat.service";
import {
  StartConversationDTO,
  SendMessageDTO,
  ConversationQueryDTO,
  MessageQueryDTO,
} from "../dtos/chat.dto";

const chatService = new ChatService();

export class ChatController {
  // Start or get existing conversation
  async startConversation(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const parsedData = StartConversationDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const result = await chatService.startOrGetConversation(
        parsedData.data,
        userId,
      );

      return res.status(201).json({
        success: true,
        message: "Conversation started successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // Get user's conversations
  async getConversations(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const parsedQuery = ConversationQueryDTO.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const result = await chatService.getUserConversations(
        userId,
        parsedQuery.data.page,
        parsedQuery.data.size,
      );

      return res.status(200).json({
        success: true,
        data: result.conversations,
        total: result.total,
        page: parsedQuery.data.page,
        size: parsedQuery.data.size,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // Get single conversation
  async getConversation(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const conversation = await chatService.getConversation(
        req.params.id as string,
        userId,
      );

      return res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // Check existing conversation for a laptop & buyer
  async getLaptopConversation(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const conversation = await chatService.getLaptopConversation(
        req.params.laptopId as string,
        userId,
      );

      return res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // Send a message
  async sendMessage(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const parsedData = SendMessageDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      // Handle file upload from chat
      if (req.file) {
        parsedData.data.fileUrl = `/uploads/${req.file.filename}`;
      }

      const message = await chatService.sendMessage(
        req.params.id as string,
        parsedData.data,
        userId,
      );

      return res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: message,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // Get messages for a conversation
  async getMessages(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const parsedQuery = MessageQueryDTO.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const result = await chatService.getMessages(
        req.params.id as string,
        userId,
        parsedQuery.data.page,
        parsedQuery.data.size,
      );

      return res.status(200).json({
        success: true,
        data: result.messages,
        total: result.total,
        page: parsedQuery.data.page,
        size: parsedQuery.data.size,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // Mark conversation as read
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const result = await chatService.markAsRead(req.params.id as string, userId);

      return res.status(200).json({
        success: true,
        message: "Messages marked as read",
        data: result,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // Archive conversation
  async archiveConversation(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const result = await chatService.archiveConversation(
        req.params.id as string,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
