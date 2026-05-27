import mongoose, { Document, Schema } from "mongoose";
import { WishlistType } from "../types/wishlist.types";

const WishlistSchema: Schema = new Schema<WishlistType>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    laptopIds: [
      {
        type: String,
        ref: "Laptop",
      },
    ],
    name: {
      type: String,
      maxlength: 100,
      default: "My Wishlist",
    },
    description: {
      type: String,
      maxlength: 500,
    },
    //
  },
  {
    timestamps: true,
  },
);

export interface IWishlist extends WishlistType, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const WishlistModel = mongoose.model<IWishlist>(
  "Wishlist",
  WishlistSchema,
);
