import { Router } from "express";
import { uploads } from "../middlewares/upload.middleware";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { ChatController } from "../controllers/chat.controller";

const chatController = new ChatController();
const router = Router();

// All chat routes require authentication
router.use(authorizedMiddleware);

// Conversations
router.post("/", chatController.startConversation.bind(chatController));
router.get("/", chatController.getConversations.bind(chatController));
router.get("/laptop/:laptopId", chatController.getLaptopConversation.bind(chatController));
router.get("/:id", chatController.getConversation.bind(chatController));
router.patch("/:id/read", chatController.markAsRead.bind(chatController));
router.patch("/:id/archive", chatController.archiveConversation.bind(chatController));

// Messages
router.get(
  "/:id/messages",
  chatController.getMessages.bind(chatController),
);
router.post(
  "/:id/messages",
  uploads.single("file"),
  chatController.sendMessage.bind(chatController),
);

export default router;
