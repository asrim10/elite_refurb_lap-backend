import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "../config";
import jwt from "jsonwebtoken";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repositories";
import { IUser } from "../models/auth.model";

declare global {
  namespace Express {
    interface Request {
      user?: Record<string, any> | IUser;
    }
  }
} // adding tag (user) to request, can use req.user
let userRepository = new UserRepository();
export const authorizedMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      throw new HttpError("Unauthorized JWT invalid", 401);
    // JWT token should start with "Bearer <token>"
    const token = authHeader.split(" ")[1]; // 0 -> Bearer, 1 -> token
    if (!token) throw new HttpError("Unauthorized JWT missing", 401);
    const decodedToken = jwt.verify(token, JWT_SECRET) as Record<string, any>;
    if (!decodedToken || !decodedToken.id) {
      throw new HttpError("Unauthorized JWT unverified", 401);
    } // make function async
    const user = await userRepository.getUserByID(decodedToken.id);
    if (!user) throw new HttpError("Unauthorized user not found", 401);
    req.user = user; // attach user to request (like tag)
    next();
  } catch (err: Error | any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message });
  }
};

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new HttpError("Unauthorized no user info", 401);
    }
    if (req.user.role !== "admin") {
      throw new HttpError("Forbidden not admin", 403);
    }
    return next();
  } catch (err: Error | any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message });
  }
};
