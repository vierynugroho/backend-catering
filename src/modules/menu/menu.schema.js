import { z } from "zod";

const MAX_MENU_PRICE = 99999999;

const createMenuSchema = z.object({
  name: z.string().min(2, "Nama menu minimal 2 karakter"),
  slug: z.string().min(2, "Slug menu minimal 2 karakter"),
  is_active: z.coerce.boolean().default(true).optional(),
  category_id: z.string().min(1, "Kategori menu wajib diisi").optional(),
  price: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? 0 : Number(val),
    z
      .number()
      .min(0, "Harga menu tidak boleh negatif")
      .max(MAX_MENU_PRICE, `Harga menu maksimal ${MAX_MENU_PRICE}`),
  ),
  description: z.string().optional(),
});

const updateMenuSchema = z.object({
  name: z.string().min(2, "Nama menu minimal 2 karakter").optional(),
  slug: z.string().min(2, "Slug menu minimal 2 karakter").optional(),
  is_active: z.coerce.boolean().default(true).optional(),
  category_id: z.string().min(1, "Kategori menu wajib diisi").optional(),
  price: z
    .preprocess(
      (val) =>
        val === "" || val === null || val === undefined ? 0 : Number(val),
      z
        .number()
        .min(0, "Harga menu tidak boleh negatif")
        .max(MAX_MENU_PRICE, `Harga menu maksimal ${MAX_MENU_PRICE}`),
    )
    .optional(),
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

const searchMenuSchema = z.object({
  name: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

const searchCategorySchema = z.object({
  name: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export {
  createMenuSchema,
  updateMenuSchema,
  createCategorySchema,
  updateCategorySchema,
  searchMenuSchema,
  searchCategorySchema,
};
