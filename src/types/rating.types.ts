import z from "zod";
import mongoose from "mongoose";

export const RatingSchema = z.object({
  ratedSellerId: z.instanceof(mongoose.Types.ObjectId).or(z.string()),
  ratedByUserId: z.instanceof(mongoose.Types.ObjectId).or(z.string()),
  rating: z.number().min(1).max(5).int(),
  review: z.string().min(1).max(1000).optional(),
});

export type RatingType = z.infer<typeof RatingSchema>;
