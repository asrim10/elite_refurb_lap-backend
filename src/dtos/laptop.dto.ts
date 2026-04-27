import z from "zod";
import { LaptopSchema } from "../types/laptop.types";

export const LaptopQueryDTO = z.object({
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
  brand: z.string().optional(),
  condition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
  status: z.enum(["available", "sold", "reserved"]).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minRam: z.coerce.number().positive().optional(),
  storageType: z.enum(["SSD", "HDD", "eMMC"]).optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest", "oldest"])
    .default("newest"),
});
export type LaptopQueryDTO = z.infer<typeof LaptopQueryDTO>;

export const CreateLaptopDTO = LaptopSchema.omit({ sellerId: true }); // sellerId injected from auth
export type CreateLaptopDTO = z.infer<typeof CreateLaptopDTO>;

export const UpdateLaptopDTO = LaptopSchema.partial().omit({ sellerId: true });
export type UpdateLaptopDTO = z.infer<typeof UpdateLaptopDTO>;
