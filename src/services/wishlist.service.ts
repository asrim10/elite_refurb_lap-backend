import { HttpError } from "../errors/http-error";
import {
  CreateWishlistDTO,
  UpdateWishlistDTO,
  WishlistQueryDTO,
} from "../dtos/wishlist.dto";
import { WishlistRepository } from "../repositories/wishlist.repositories";

const wishlistRepository = new WishlistRepository();

export class WishlistService {
  async createWishlist(userId: string, data?: CreateWishlistDTO) {
    // Check if user already has a wishlist
    const existingWishlist =
      await wishlistRepository.getWishlistByUserId(userId);
    if (existingWishlist) {
      throw new HttpError("User already has a wishlist", 409);
    }

    const wishlist = await wishlistRepository.createWishlist(userId, data);
    return wishlist;
  }

  async getWishlistByUserId(userId: string) {
    const wishlist = await wishlistRepository.getWishlistByUserId(userId);
    if (!wishlist) {
      throw new HttpError("Wishlist not found", 404);
    }
    return wishlist;
  }

  async getPublicWishlist(userId: string) {
    const wishlist = await wishlistRepository.getPublicWishlist(userId);
    if (!wishlist) {
      throw new HttpError("Public wishlist not found", 404);
    }
    return wishlist;
  }

  async addLaptopToWishlist(userId: string, laptopId: string) {
    // Check if wishlist exists, if not create one
    let wishlist = await wishlistRepository.getWishlistByUserId(userId);
    if (!wishlist) {
      wishlist = await wishlistRepository.createWishlist(userId);
    }

    // Check if laptop is already in wishlist
    const isAlreadyInWishlist =
      await wishlistRepository.checkIfLaptopInWishlist(userId, laptopId);
    if (isAlreadyInWishlist) {
      throw new HttpError("Laptop already in wishlist", 409);
    }

    const updatedWishlist = await wishlistRepository.addLaptopToWishlist(
      userId,
      laptopId,
    );
    if (!updatedWishlist) {
      throw new HttpError("Failed to add laptop to wishlist", 500);
    }

    return updatedWishlist;
  }

  async removeLaptopFromWishlist(userId: string, laptopId: string) {
    const wishlist = await wishlistRepository.getWishlistByUserId(userId);
    if (!wishlist) {
      throw new HttpError("Wishlist not found", 404);
    }

    const isInWishlist = await wishlistRepository.checkIfLaptopInWishlist(
      userId,
      laptopId,
    );
    if (!isInWishlist) {
      throw new HttpError("Laptop not in wishlist", 404);
    }

    const updatedWishlist = await wishlistRepository.removeLaptopFromWishlist(
      userId,
      laptopId,
    );
    if (!updatedWishlist) {
      throw new HttpError("Failed to remove laptop from wishlist", 500);
    }

    return updatedWishlist;
  }

  async clearWishlist(userId: string) {
    const wishlist = await wishlistRepository.getWishlistByUserId(userId);
    if (!wishlist) {
      throw new HttpError("Wishlist not found", 404);
    }

    const clearedWishlist = await wishlistRepository.clearWishlist(userId);
    if (!clearedWishlist) {
      throw new HttpError("Failed to clear wishlist", 500);
    }

    return clearedWishlist;
  }

  async updateWishlist(userId: string, data: UpdateWishlistDTO) {
    const wishlist = await wishlistRepository.getWishlistByUserId(userId);
    if (!wishlist) {
      throw new HttpError("Wishlist not found", 404);
    }

    const updatedWishlist = await wishlistRepository.updateWishlist(
      userId,
      data,
    );
    if (!updatedWishlist) {
      throw new HttpError("Failed to update wishlist", 500);
    }

    return updatedWishlist;
  }

  async deleteWishlist(userId: string) {
    const wishlist = await wishlistRepository.getWishlistByUserId(userId);
    if (!wishlist) {
      throw new HttpError("Wishlist not found", 404);
    }

    const deleted = await wishlistRepository.deleteWishlist(userId);
    if (!deleted) {
      throw new HttpError("Failed to delete wishlist", 500);
    }

    return { message: "Wishlist deleted successfully" };
  }

  async checkIfLaptopInWishlist(userId: string, laptopId: string) {
    return await wishlistRepository.checkIfLaptopInWishlist(userId, laptopId);
  }

  async getAllPublicWishlists(query: WishlistQueryDTO) {
    return await wishlistRepository.getAllWishlists(query);
  }
}
