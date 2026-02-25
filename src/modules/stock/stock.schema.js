import { z } from "zod";

const createStockSchema = z.object({
  event_date: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: "Tanggal tidak valid" }),
  max_stock: z.coerce
    .number({
      required_error: "Stok maksimal wajib diisi",
      invalid_type_error: "Stok maksimal harus berupa angka",
    })
    .positive("Stok maksimal harus lebih besar dari 0")
    .default(0),
  current_stock: z.coerce
    .number({
      required_error: "Stok saat ini wajib diisi",
      invalid_type_error: "Stok saat ini harus berupa angka",
    })
    .nonnegative("Stok saat ini tidak boleh negatif")
    .default(0),
});

const updateStockSchema = z.object({
  event_date: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: "Tanggal tidak valid" })
    .optional(),
  max_stock: z.coerce
    .number({
      required_error: "Stok maksimal wajib diisi",
      invalid_type_error: "Stok maksimal harus berupa angka",
    })
    .positive("Stok maksimal harus lebih besar dari 0")
    .optional(),
  current_stock: z.coerce
    .number({
      required_error: "Stok saat ini wajib diisi",
      invalid_type_error: "Stok saat ini harus berupa angka",
    })
    .nonnegative("Stok saat ini tidak boleh negatif")
    .optional(),
});

export { createStockSchema, updateStockSchema };
