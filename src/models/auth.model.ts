import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/auth.types";

const UserSchema: Schema = new Schema<UserType>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    imageUrl: { type: String, required: false },
    phoneNumber: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

export interface IUser extends UserType, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>("User", UserSchema);
