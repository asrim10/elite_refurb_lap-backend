import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { HttpError } from "./errors/http-error";
import { initializeSocket } from "./socket/chat.socket";
import { initializeNotificationSocket } from "./socket/notification.socket";

import authRoutes from "./routes/auth.routes";
import laptopRoutes from "./routes/laptop.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import ratingRoutes from "./routes/rating.routes";
import chatRoutes from "./routes/chat.routes";
import notificationRoutes from "./routes/notification.routes";

dotenv.config();

console.log(process.env.PORT);

const app: Application = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Initialize Notification Socket handlers
initializeNotificationSocket(io);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/laptops", laptopRoutes);
app.use("/api/wishlists", wishlistRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to API World!");
});

app.use((err: Error, req: Request, res: Response, next: Function) => {
  if (err instanceof HttpError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }
  return res
    .status(500)
    .json({ success: false, message: err.message || "Internal Server Error" });
});

export { io };
export default server;
