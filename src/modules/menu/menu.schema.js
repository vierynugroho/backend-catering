import { z } from "zod";

const createMenuSchema = z.object({
  name: z.string().min(2, "Nama menu minimal 2 karakter"),
  slug: z.string().min(2, "Slug menu minimal 2 karakter"),
  is_active: z.boolean().optional().default(true),
  category_id: z.number().optional().min(1, "Kategori menu wajib diisi"),
  price: z.number().min(0, "Harga menu tidak boleh negatif"),
  description: z.string().optional(),
});

const updateMenuSchema = z.object({
  name: z.string().optional().min(2, "Nama menu minimal 2 karakter"),
  slug: z.string().optional().min(2, "Slug menu minimal 2 karakter"),
  is_active: z.boolean().optional().default(true),
  category_id: z.number().optional().min(1, "Kategori menu wajib diisi"),
  price: z.number().optional().min(0, "Harga menu tidak boleh negatif"),
  description: z.string().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  slug: z.string().min(2, "Slug kategori minimal 2 karakter"),
});

const updateCategorySchema = z.object({
  name: z.string().optional().min(2, "Nama kategori minimal 2 karakter"),
  slug: z.string().optional().min(2, "Slug kategori minimal 2 karakter"),
});

export {
  createMenuSchema,
  updateMenuSchema,
  createCategorySchema,
  updateCategorySchema,
};
