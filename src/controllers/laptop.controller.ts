import { Request, Response } from "express";
import z from "zod";
import { LaptopService } from "../services/laptop.service";
import {
  CreateLaptopDTO,
  UpdateLaptopDTO,
  LaptopQueryDTO,
} from "../dtos/laptop.dto";

const laptopService = new LaptopService();

export class LaptopController {
  async create(req: Request, res: Response) {
    try {
      const sellerId = req.user?._id?.toString();
      if (!sellerId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
      const parsedData = CreateLaptopDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }
      if (req.files && Array.isArray(req.files)) {
        parsedData.data.images = req.files.map((f) => `/uploads/${f.filename}`);
      }
      const laptop = await laptopService.createLaptop(
        parsedData.data,
        sellerId,
      );
      return res.status(201).json({
        success: true,
        message: "Laptop listed successfully",
        data: laptop,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const parsedQuery = LaptopQueryDTO.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedQuery.error),
        });
      }
      const { laptops, total } = await laptopService.getAllLaptops(
        parsedQuery.data,
      );
      return res.status(200).json({
        success: true,
        data: laptops,
        total,
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

  async getById(req: Request, res: Response) {
    try {
      const laptop = await laptopService.getLaptopById(req.params.id as string);
      return res.status(200).json({ success: true, data: laptop });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // Logged in user sees their own listings
  async getMyListings(req: Request, res: Response) {
    try {
      const sellerId = req.user?._id?.toString();
      if (!sellerId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
      const laptops = await laptopService.getMyListings(sellerId);
      return res.status(200).json({ success: true, data: laptops });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getSellerListings(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const laptops = await laptopService.getSellerListings(sellerId as string);
      return res.status(200).json({ success: true, data: laptops });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      const userRole = req.user?.role;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
      const parsedData = UpdateLaptopDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }
      if (req.files && Array.isArray(req.files)) {
        parsedData.data.images = req.files.map((f) => `/uploads/${f.filename}`);
      }
      const updated = await laptopService.updateLaptop(
        req.params.id as string,
        parsedData.data,
        userId,
        userRole ?? "user",
      );
      return res.status(200).json({
        success: true,
        data: updated,
        message: "Laptop updated successfully",
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      const userRole = req.user?.role;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
      const result = await laptopService.deleteLaptop(
        req.params.id as string,
        userId,
        userRole ?? "user",
      );
      return res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
