import z from "zod";

export const WishlistSchema = z.object({
  userId: z.string(),
  laptopIds: z.array(z.string()).default([]),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export type WishlistType = z.infer<typeof WishlistSchema>;
