import mongoose from "mongoose";
import { HttpError } from "../errors/http-error";
import {
  CreateRatingDTO,
  UpdateRatingDTO,
  RatingQueryDTO,
} from "../dtos/rating.dto";
import { RatingRepository } from "../repositories/rating.repositories";

const ratingRepository = new RatingRepository();

export class RatingService {
  async createRating(data: CreateRatingDTO, userId: string) {
    const sellerId = data.ratedSellerId.toString();

    // Check if user already rated this seller
    const existingRating = await ratingRepository.getRatingBySellerAndUser(
      sellerId,
      userId,
    );
    if (existingRating) {
      throw new HttpError("You have already rated this seller", 400);
    }

    const rating = await ratingRepository.createRating({
      ...data,
      ratedSellerId: new mongoose.Types.ObjectId(sellerId),
      ratedByUserId: new mongoose.Types.ObjectId(userId),
    });
    return rating;
  }

  async getRatingById(id: string) {
    const rating = await ratingRepository.getRatingById(id);
    if (!rating) {
      throw new HttpError("Rating not found", 404);
    }
    return rating;
  }

  async getSellerRatings(sellerId: string) {
    return await ratingRepository.getRatingsBySellerWithStats(sellerId);
  }

  async getAllRatings(query: RatingQueryDTO) {
    return await ratingRepository.getAllRatings(query);
  }

  async updateRating(id: string, data: UpdateRatingDTO, requesterId: string) {
    const rating = await ratingRepository.getRatingById(id);
    if (!rating) {
      throw new HttpError("Rating not found", 404);
    }

    // Only the user who created the rating can update it
    if (rating.ratedByUserId.toString() !== requesterId) {
      throw new HttpError("You can only update your own ratings", 403);
    }

    const updatedRating = await ratingRepository.updateRating(id, data);
    return updatedRating;
  }

  async deleteRating(id: string, requesterId: string) {
    const rating = await ratingRepository.getRatingById(id);
    if (!rating) {
      throw new HttpError("Rating not found", 404);
    }

    // Only the user who created the rating can delete it
    if (rating.ratedByUserId.toString() !== requesterId) {
      throw new HttpError("You can only delete your own ratings", 403);
    }

    const deleted = await ratingRepository.deleteRating(id);
    if (!deleted) {
      throw new HttpError("Failed to delete rating", 500);
    }
    return { success: true, message: "Rating deleted successfully" };
  }
}
