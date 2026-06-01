import { RatingModel, IRating } from "../models/rating.model";
import { RatingQueryDTO } from "../dtos/rating.dto";

export interface IRatingRepository {
  createRating(data: Partial<IRating>): Promise<IRating>;
  getRatingById(id: string): Promise<IRating | null>;
  getRatingsBySellerWithStats(sellerId: string): Promise<{
    ratings: IRating[];
    averageRating: number;
    totalRatings: number;
  }>;
  getAllRatings(
    query: RatingQueryDTO,
  ): Promise<{ ratings: IRating[]; total: number }>;
  getRatingBySellerAndUser(
    sellerId: string,
    userId: string,
  ): Promise<IRating | null>;
  updateRating(id: string, data: Partial<IRating>): Promise<IRating | null>;
  deleteRating(id: string): Promise<boolean>;
}

export class RatingRepository implements IRatingRepository {
  async createRating(data: Partial<IRating>): Promise<IRating> {
    const rating = new RatingModel(data);
    return await rating.save();
  }

  async getRatingById(id: string): Promise<IRating | null> {
    return await RatingModel.findById(id);
  }

  async getRatingsBySellerWithStats(sellerId: string): Promise<{
    ratings: IRating[];
    averageRating: number;
    totalRatings: number;
  }> {
    const ratings = await RatingModel.find({ ratedSellerId: sellerId })
      .populate("ratedByUserId", "fullName imageUrl username")
      .sort({
        createdAt: -1,
      });
    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;
    return { ratings, averageRating, totalRatings };
  }

  async getAllRatings(
    query: RatingQueryDTO,
  ): Promise<{ ratings: IRating[]; total: number }> {
    const {
      page,
      size,
      sellerId,
      ratedByUserId,
      minRating,
      maxRating,
      sortBy,
    } = query;

    const filter: Record<string, any> = {};

    if (sellerId) {
      filter.ratedSellerId = sellerId;
    }
    if (ratedByUserId) {
      filter.ratedByUserId = ratedByUserId;
    }

    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) {
        filter.rating.$gte = minRating;
      }
      if (maxRating) {
        filter.rating.$lte = maxRating;
      }
    }

    const sortOptions: Record<string, any> = {};
    switch (sortBy) {
      case "oldest":
        sortOptions.createdAt = 1;
        break;
      case "rating_asc":
        sortOptions.rating = 1;
        break;
      case "rating_desc":
        sortOptions.rating = -1;
        break;
      default: // newest
        sortOptions.createdAt = -1;
    }

    const total = await RatingModel.countDocuments(filter);
    const ratings = await RatingModel.find(filter)
      .populate("ratedByUserId", "fullName imageUrl username")
      .populate("ratedSellerId", "fullName imageUrl username")
      .sort(sortOptions)
      .skip((page - 1) * size)
      .limit(size);

    return { ratings, total };
  }

  async getRatingBySellerAndUser(
    sellerId: string,
    userId: string,
  ): Promise<IRating | null> {
    return await RatingModel.findOne({
      ratedSellerId: sellerId,
      ratedByUserId: userId,
    })
      .populate("ratedByUserId", "fullName imageUrl username")
      .populate("ratedSellerId", "fullName imageUrl username");
  }

  async updateRating(
    id: string,
    data: Partial<IRating>,
  ): Promise<IRating | null> {
    return await RatingModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteRating(id: string): Promise<boolean> {
    const result = await RatingModel.findByIdAndDelete(id);
    return !!result;
  }
}
