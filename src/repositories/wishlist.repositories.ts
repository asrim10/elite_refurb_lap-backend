import { WishlistModel, IWishlist } from "../models/wishlist.model";
import { WishlistQueryDTO } from "../dtos/wishlist.dto";

export interface IWishlistRepository {
  createWishlist(userId: string, data?: Partial<IWishlist>): Promise<IWishlist>;
  getWishlistByUserId(userId: string): Promise<IWishlist | null>;
  getPublicWishlist(userId: string): Promise<IWishlist | null>;
  addLaptopToWishlist(userId: string, laptopId: string): Promise<IWishlist | null>;
  removeLaptopFromWishlist(userId: string, laptopId: string): Promise<IWishlist | null>;
  clearWishlist(userId: string): Promise<IWishlist | null>;
  updateWishlist(userId: string, data: Partial<IWishlist>): Promise<IWishlist | null>;
  deleteWishlist(userId: string): Promise<boolean>;
  checkIfLaptopInWishlist(userId: string, laptopId: string): Promise<boolean>;
  getAllWishlists(query: WishlistQueryDTO): Promise<{ wishlists: IWishlist[]; total: number }>;
}

export class WishlistRepository implements IWishlistRepository {
  async createWishlist(userId: string, data?: Partial<IWishlist>): Promise<IWishlist> {
    const wishlist = new WishlistModel({
      userId,
      ...data,
    });
    return await wishlist.save();
  }

  async getWishlistByUserId(userId: string): Promise<IWishlist | null> {
    return await WishlistModel.findOne({ userId }).populate(
      "laptopIds",
      "title brand price condition images status",
    );
  }

  async getPublicWishlist(userId: string): Promise<IWishlist | null> {
    return await WishlistModel.findOne({
      userId,
      isPublic: true,
    }).populate("laptopIds", "title brand price condition images status");
  }

  async addLaptopToWishlist(userId: string, laptopId: string): Promise<IWishlist | null> {
    return await WishlistModel.findOneAndUpdate(
      { userId },
      { $addToSet: { laptopIds: laptopId } },
      { new: true },
    ).populate("laptopIds", "title brand price condition images status");
  }

  async removeLaptopFromWishlist(userId: string, laptopId: string): Promise<IWishlist | null> {
    return await WishlistModel.findOneAndUpdate(
      { userId },
      { $pull: { laptopIds: laptopId } },
      { new: true },
    ).populate("laptopIds", "title brand price condition images status");
  }

  async clearWishlist(userId: string): Promise<IWishlist | null> {
    return await WishlistModel.findOneAndUpdate(
      { userId },
      { laptopIds: [] },
      { new: true },
    );
  }

  async updateWishlist(userId: string, data: Partial<IWishlist>): Promise<IWishlist | null> {
    return await WishlistModel.findOneAndUpdate({ userId }, data, { new: true }).populate(
      "laptopIds",
      "title brand price condition images status",
    );
  }

  async deleteWishlist(userId: string): Promise<boolean> {
    const result = await WishlistModel.deleteOne({ userId });
    return result.deletedCount > 0;
  }

  async checkIfLaptopInWishlist(userId: string, laptopId: string): Promise<boolean> {
    const wishlist = await WishlistModel.findOne({
      userId,
      laptopIds: laptopId,
    });
    return wishlist !== null;
  }

  async getAllWishlists(query: WishlistQueryDTO): Promise<{ wishlists: IWishlist[]; total: number }> {
    const { page, size } = query;
    const skip = (page - 1) * size;

    const wishlists = await WishlistModel.find({ isPublic: true })
      .skip(skip)
      .limit(size)
      .populate("laptopIds", "title brand price condition images status");

    const total = await WishlistModel.countDocuments({ isPublic: true });

    return { wishlists, total };
  }
}
