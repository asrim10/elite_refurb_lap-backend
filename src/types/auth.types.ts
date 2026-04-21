import z from "zod";

export const UserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  username: z.string().min(3).max(100),
  fullName: z.string().optional(),
  role: z.enum(["user", "admin"]).default("user"),
  phoneNumber: z.string().max(30).optional(),
  imageUrl: z.string().optional(),
});

export type UserType = z.infer<typeof UserSchema>;
