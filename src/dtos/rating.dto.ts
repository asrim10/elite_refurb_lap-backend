import z from "zod";
import { RatingSchema } from "../types/rating.types";

export const RatingQueryDTO = z.object({
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(50).default(10),
  sellerId: z.string().optional(),
  ratedByUserId: z.string().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  maxRating: z.coerce.number().min(1).max(5).optional(),
  sortBy: z
    .enum(["newest", "oldest", "rating_asc", "rating_desc"])
    .default("newest"),
});
export type RatingQueryDTO = z.infer<typeof RatingQueryDTO>;

export const CreateRatingDTO = RatingSchema.omit({ ratedByUserId: true }); // ratedByUserId injected from auth
export type CreateRatingDTO = z.infer<typeof CreateRatingDTO>;

export const UpdateRatingDTO = RatingSchema.partial().omit({
  ratedByUserId: true,
  ratedSellerId: true,
});
export type UpdateRatingDTO = z.infer<typeof UpdateRatingDTO>;
