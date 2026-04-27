import z from "zod";

export const LaptopSchema = z.object({
  title: z.string().min(3).max(200),
  brand: z.string().min(1).max(100),
  modelName: z.string().min(1).max(100),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  condition: z.enum(["excellent", "good", "fair", "poor"]),
  status: z.enum(["available", "sold", "reserved"]).default("available"),
  description: z.string().min(10).max(2000).optional(),
  images: z.array(z.string()).default([]),
  // Specs
  processor: z.string().min(1).max(100),
  ram: z.number().positive(), // in GB
  storage: z.number().positive(), // in GB
  storageType: z.enum(["SSD", "HDD", "eMMC"]),
  displaySize: z.number().positive(), // in inches
  displayResolution: z.string().optional(), // e.g. "1920x1080"
  gpu: z.string().optional(),
  operatingSystem: z.string().optional(),
  batteryLife: z.number().positive().optional(), // in hours
  weight: z.number().positive().optional(), // in kg
  // Meta
  sellerId: z.string(),
  yearOfManufacture: z
    .number()
    .min(2000)
    .max(new Date().getFullYear())
    .optional(),
  warrantyMonths: z.number().min(0).default(0),
  tags: z.array(z.string()).default([]),
});

export type LaptopType = z.infer<typeof LaptopSchema>;
