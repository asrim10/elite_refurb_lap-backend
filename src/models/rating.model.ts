import mongoose, { Document, Schema } from "mongoose";
import { RatingType } from "../types/rating.types";

const RatingSchema: Schema = new Schema<RatingType>(
  {
    ratedSellerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "User",
    },
    ratedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "User",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      optional: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate ratings from the same user for the same seller
RatingSchema.index({ ratedSellerId: 1, ratedByUserId: 1 }, { unique: true });

export interface IRating extends RatingType, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const RatingModel = mongoose.model<IRating>("Rating", RatingSchema);
