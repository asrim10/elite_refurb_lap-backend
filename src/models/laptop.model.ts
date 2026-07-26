import mongoose, { Document, Schema } from "mongoose";
import { LaptopType } from "../types/laptop.types";

const LaptopSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    brand: { type: String, required: true },
    modelName: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    condition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "sold", "reserved"],
      default: "available",
    },
    description: { type: String },
    images: [{ type: String }],
    // Specs
    processor: { type: String, required: true },
    ram: { type: Number, required: true },
    storage: { type: Number, required: true },
    storageType: {
      type: String,
      enum: ["SSD", "HDD", "eMMC"],
      required: true,
    },
    displaySize: { type: Number, required: true },
    displayResolution: { type: String },
    gpu: { type: String },
    operatingSystem: { type: String },
    batteryLife: { type: Number },
    weight: { type: Number },
    // Meta
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    yearOfManufacture: { type: Number },
    warrantyMonths: { type: Number, default: 0 },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
    },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc: any, ret: Record<string, any>) {
        if (ret.sellerId && typeof ret.sellerId === "object") {
          const seller = ret.sellerId;
          ret.sellerId = seller._id?.toString();
          ret.sellerName = seller.fullName ?? null;
          ret.sellerImage = seller.imageUrl ?? null;
          ret.sellerPhone = seller.phoneNumber ?? null;
        }
        return ret;
      },
    },
  },
);

export interface ILaptop extends Omit<LaptopType, "sellerId">, Document {
  _id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

export const LaptopModel = mongoose.model<ILaptop>("Laptop", LaptopSchema);
