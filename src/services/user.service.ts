import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repositories";
import bcryptjs from "bcryptjs";
let userRepository = new UserRepository();
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import { sendEmail } from "../config/email";
const CLIENT_URL = process.env.CLIENT_URL as string;

export class UserService {
  async createUser(data: CreateUserDTO) {
    //business logic before creating user
    const emailCheck = await userRepository.getUserByEmail(data.email);
    if (emailCheck) {
      throw new HttpError("Email already in use", 403);
    }

    //hash password
    const hashedPassword = await bcryptjs.hash(data.password, 10); //10 complexity
    data.password = hashedPassword;

    //create user
    const newUser = await userRepository.createUser(data);
    return newUser;
  }
  async loginUser(data: LoginUserDTO) {
    const user = await userRepository.getUserByEmail(data.email);
    if (!user) {
      throw new HttpError("User not found", 404);
    }
    const validPassword = await bcryptjs.compare(data.password, user.password);
    if (!validPassword) {
      throw new HttpError("Invalid credentials", 401);
    }
    //generate jwt
    const payload = {
      id: user._id,
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      phoneNumber: user.phoneNumber,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" }); // 30days
    return { token, user };
  }

  async getUserById(userId: string) {
    const user = await userRepository.getUserByID(userId);
    if (!user) {
      throw new HttpError("User not found", 404);
    }
    return user;
  }

  async updateUser(userId: string, data: UpdateUserDTO) {
    const user = await userRepository.getUserByID(userId);
    if (!user) {
      throw new HttpError("User not found", 404);
    }
    if (user.email !== data.email) {
      const emailExists = await userRepository.getUserByEmail(data.email!);
      if (emailExists) {
        throw new HttpError("Email already in use", 403);
      }
    }

    if (data.password) {
      const hashedPassword = await bcryptjs.hash(data.password, 10);
      data.password = hashedPassword;
    }
    const updatedUser = await userRepository.updateUser(userId, data);
    return updatedUser;
  }

  async deleteUser(userId: string) {
    const existingUser = await userRepository.getUserByID(userId);
    if (!existingUser) {
      throw new HttpError("User not found", 404);
    }

    const deleted = await userRepository.deleteUserById(userId);
    if (!deleted) {
      throw new HttpError("Failed to delete user", 500);
    }

    return { message: "User deleted successfully" };
  }

  async sendResetPasswordEmail(email?: string) {
    if (!email) {
      throw new HttpError("Email is required", 400);
    }
    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      throw new HttpError("User not found", 404);
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiry
    const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
    const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
    await sendEmail(user.email, "Password Reset", html);
    return user;
  }

  async resetPassword(token?: string, newPassword?: string) {
    try {
      if (!token || !newPassword) {
        throw new HttpError("Token and new password are required", 400);
      }
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const user = await userRepository.getUserByID(userId);
      if (!user) {
        throw new HttpError("User not found", 404);
      }
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      await userRepository.updateUser(userId, { password: hashedPassword });
      return user;
    } catch (error) {
      throw new HttpError("Invalid or expired token", 400);
    }
  }
}
