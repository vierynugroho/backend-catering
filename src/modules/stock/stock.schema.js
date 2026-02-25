import { z } from "zod";

import moment from "moment-timezone";

const TIMEZONE = "Asia/Jakarta";

const parseWIBDateTime = (value) => {
  console.log("Parsing date:", value);
  const m = moment.tz(value, "DD-MM-YYYY HH:mm:ss", true, TIMEZONE);
  console.log({ m });
  if (!m.isValid()) return null;
  return m.toDate();
};

const createStockSchema = z.object({
  event_date: z
    .string({ required_error: "Tanggal acara wajib diisi" })
    .refine((v) => parseWIBDateTime(v) !== null, {
      message:
        "Format tanggal harus DD-MM-YYYY HH:mm:ss dan harus tanggal valid (WIB)",
    })
    .transform((v) => parseWIBDateTime(v)),
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
    .string({ required_error: "Tanggal acara wajib diisi" })
    .refine((v) => parseWIBDateTime(v) !== null, {
      message:
        "Format tanggal harus DD-MM-YYYY HH:mm:ss dan harus tanggal valid (WIB)",
    })
    .transform((v) => parseWIBDateTime(v))
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
