import z from "zod";
import { WishlistSchema } from "../types/wishlist.types";

export const CreateWishlistDTO = WishlistSchema.omit({
  userId: true,
  laptopIds: true,
});
export type CreateWishlistDTO = z.infer<typeof CreateWishlistDTO>;

export const UpdateWishlistDTO = WishlistSchema.omit({ userId: true }).partial();
export type UpdateWishlistDTO = z.infer<typeof UpdateWishlistDTO>;

export const AddLaptopToWishlistDTO = z.object({
  laptopId: z.string().min(1),
});
export type AddLaptopToWishlistDTO = z.infer<typeof AddLaptopToWishlistDTO>;

export const RemoveLaptopFromWishlistDTO = z.object({
  laptopId: z.string().min(1),
});
export type RemoveLaptopFromWishlistDTO = z.infer<
  typeof RemoveLaptopFromWishlistDTO
>;

export const WishlistQueryDTO = z.object({
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(50).default(10),
});
export type WishlistQueryDTO = z.infer<typeof WishlistQueryDTO>;
