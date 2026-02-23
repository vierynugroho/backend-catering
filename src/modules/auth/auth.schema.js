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

const updateProfileSchema = z.object({
  fullname: z.string().min(2, "Fullname minimal 2 karakter").optional(),
  email: z.string().email("Email tidak valid").optional(),
  password: z.string().min(8, "Password minimal 8 karakter").optional(),
  confirm_password: z
    .string()
    .min(8, "Confirm password minimal 8 karakter")
    .optional(),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit").optional(),
  address: z.string().min(5, "Alamat minimal 5 karakter").optional(),
});

export { registerSchema, loginSchema, updateProfileSchema };
