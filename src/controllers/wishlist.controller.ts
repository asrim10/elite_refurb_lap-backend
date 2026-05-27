import { Request, Response } from "express";
import z from "zod";
import { WishlistService } from "../services/wishlist.service";
import {
  CreateWishlistDTO,
  UpdateWishlistDTO,
  AddLaptopToWishlistDTO,
  RemoveLaptopFromWishlistDTO,
  WishlistQueryDTO,
} from "../dtos/wishlist.dto";

const wishlistService = new WishlistService();

export class WishlistController {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const parsedData = CreateWishlistDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const wishlist = await wishlistService.createWishlist(
        userId,
        parsedData.data,
      );
      return res.status(201).json({
        success: true,
        message: "Wishlist created successfully",
        data: wishlist,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getMyWishlist(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const wishlist = await wishlistService.getWishlistByUserId(userId);
      return res.status(200).json({
        success: true,
        message: "Wishlist retrieved successfully",
        data: wishlist,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getPublicWishlist(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const wishlist = await wishlistService.getPublicWishlist(userId);
      return res.status(200).json({
        success: true,
        message: "Public wishlist retrieved successfully",
        data: wishlist,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async addLaptop(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const parsedData = AddLaptopToWishlistDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const wishlist = await wishlistService.addLaptopToWishlist(
        userId,
        parsedData.data.laptopId,
      );
      return res.status(200).json({
        success: true,
        message: "Laptop added to wishlist successfully",
        data: wishlist,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async removeLaptop(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const parsedData = RemoveLaptopFromWishlistDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const wishlist = await wishlistService.removeLaptopFromWishlist(
        userId,
        parsedData.data.laptopId,
      );
      return res.status(200).json({
        success: true,
        message: "Laptop removed from wishlist successfully",
        data: wishlist,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async clear(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const wishlist = await wishlistService.clearWishlist(userId);
      return res.status(200).json({
        success: true,
        message: "Wishlist cleared successfully",
        data: wishlist,
      });
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
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const parsedData = UpdateWishlistDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const wishlist = await wishlistService.updateWishlist(
        userId,
        parsedData.data,
      );
      return res.status(200).json({
        success: true,
        message: "Wishlist updated successfully",
        data: wishlist,
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
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const result = await wishlistService.deleteWishlist(userId);
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

  async checkLaptopInWishlist(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const { laptopId } = req.params;

      const isInWishlist = await wishlistService.checkIfLaptopInWishlist(
        userId,
        laptopId,
      );
      return res.status(200).json({
        success: true,
        data: { isInWishlist },
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getAllPublicWishlists(req: Request, res: Response) {
    try {
      const parsedQuery = WishlistQueryDTO.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const { wishlists, total } = await wishlistService.getAllPublicWishlists(
        parsedQuery.data,
      );
      return res.status(200).json({
        success: true,
        message: "Public wishlists retrieved successfully",
        data: wishlists,
        pagination: {
          total,
          page: parsedQuery.data.page,
          size: parsedQuery.data.size,
          totalPages: Math.ceil(total / parsedQuery.data.size),
        },
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
