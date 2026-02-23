import { z } from "zod";

const createMenuSchema = z.object({
  name: z.string().min(2, "Nama menu minimal 2 karakter"),
  slug: z.string().min(2, "Slug menu minimal 2 karakter"),
  is_active: z.coerce.boolean().default(true).optional(),
  category_id: z.string().min(1, "Kategori menu wajib diisi").optional(),
  price: z.coerce.number().min(0, "Harga menu tidak boleh negatif"),
  description: z.string().optional(),
});

const updateMenuSchema = z.object({
  name: z.string().min(2, "Nama menu minimal 2 karakter").optional(),
  slug: z.string().min(2, "Slug menu minimal 2 karakter").optional(),
  is_active: z.coerce.boolean().default(true).optional(),
  category_id: z.string().min(1, "Kategori menu wajib diisi").optional(),
  price: z.coerce.number().min(0, "Harga menu tidak boleh negatif").optional(),
  description: z.string().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  slug: z.string().min(2, "Slug kategori minimal 2 karakter"),
});

const updateCategorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter").optional(),
  slug: z.string().min(2, "Slug kategori minimal 2 karakter"),
});

export {
  createMenuSchema,
  updateMenuSchema,
  createCategorySchema,
  updateCategorySchema,
};
