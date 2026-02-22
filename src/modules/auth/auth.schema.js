import { z } from "zod";

const registerSchema = z.object({
  fullname: z.string().min(2, "Fullname minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export { registerSchema, loginSchema };
