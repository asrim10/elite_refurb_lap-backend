import mongoose, { Document, Schema } from "mongoose";
import { LaptopType } from "../types/laptop.types";

const LaptopSchema: Schema = new Schema<LaptopType>(
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
    sellerId: { type: String, required: true },
    yearOfManufacture: { type: Number },
    warrantyMonths: { type: Number, default: 0 },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

export interface ILaptop extends LaptopType, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const LaptopModel = mongoose.model<ILaptop>("Laptop", LaptopSchema);
