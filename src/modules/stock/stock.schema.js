import { z } from "zod";

const ddmmyyyyRegex = /^\d{2}-\d{2}-\d{4}$/;

function isValidDDMMYYYY(value) {
  if (!ddmmyyyyRegex.test(value)) return false;

  const [ddStr, mmStr, yyyyStr] = value.split("-");
  const dd = Number(ddStr);
  const mm = Number(mmStr);
  const yyyy = Number(yyyyStr);

  if (!Number.isInteger(dd) || !Number.isInteger(mm) || !Number.isInteger(yyyy))
    return false;
  if (mm < 1 || mm > 12) return false;

  const daysInMonth = new Date(yyyy, mm, 0).getDate(); // mm is 1-12, day 0 => last day prev month
  if (dd < 1 || dd > daysInMonth) return false;

  return true;
}

const createStockSchema = z.object({
  event_date: z
    .string({
      required_error: "Tanggal acara wajib diisi",
      invalid_type_error:
        "Tanggal acara harus berupa teks tanggal (DD-MM-YYYY)",
    })
    .refine(isValidDDMMYYYY, {
      message: "Format tanggal harus DD-MM-YYYY dan harus tanggal yang valid",
    }),
  menu_id: z.string({
    required_error: "ID menu wajib diisi",
    invalid_type_error: "ID menu harus berupa string",
  }),
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
    .string({
      required_error: "Tanggal acara wajib diisi",
      invalid_type_error:
        "Tanggal acara harus berupa teks tanggal (DD-MM-YYYY)",
    })
    .refine(isValidDDMMYYYY, {
      message: "Format tanggal harus DD-MM-YYYY dan harus tanggal yang valid",
    })
    .optional(),
  menu_id: z
    .string({
      required_error: "ID menu wajib diisi",
      invalid_type_error: "ID menu harus berupa string",
    })
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
