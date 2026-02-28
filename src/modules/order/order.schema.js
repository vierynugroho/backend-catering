import { z } from "zod";

const createOrderSchema = z.object({
  customer_name: z.string().min(2),
  phone: z.string().min(9, "No. telp tidak valid"),
  destination: z.string().min(5),
  order_date: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: "Tanggal tidak valid" }),
  note: z.string().optional(),
  delivery_method: z.enum(["dikirim", "ambil_sendiri"], {
    errorMap: () => ({
      message: "Metode pengiriman harus 'dikirim' atau 'ambil_sendiri'",
    }),
  }),
  items: z
    .array(
      z.object({
        menu_id: z.string().cuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Minimal 1 item"),
});

const updateOrderSchema = z.object({
  customer_name: z.string().min(2),
  phone: z.string().min(9, "No. telp tidak valid"),
  destination: z.string().min(5),
  order_date: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: "Tanggal tidak valid" }),
  note: z.string().optional(),
  delivery_method: z.enum(["dikirim", "ambil_sendiri"], {
    errorMap: () => ({
      message: "Metode pengiriman harus 'dikirim' atau 'ambil_sendiri'",
    }),
  }),
  order_status: z.enum(
    [
      "pesanan_diterima",
      "pesanan_diproses",
      "pesanan_selesai",
      "pesanan_dibatalkan",
    ],
    {
      errorMap: () => ({
        message:
          "Status pesanan tidak valid, harus salah satu dari: 'pesanan_diterima', 'pesanan_diproses', 'pesanan_selesai', 'pesanan_dibatalkan'",
      }),
    },
  ),
  items: z
    .array(
      z.object({
        menu_id: z.string().cuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Minimal 1 item"),
  shipping_cost: z.number().min(0).optional(),
});

const updateOrderStatusSchema = z.object({
  order_status: z.enum(
    [
      "pesanan_diterima",
      "pesanan_diproses",
      "pesanan_selesai",
      "pesanan_dibatalkan",
    ],
    {
      errorMap: () => ({
        message:
          "Status pesanan tidak valid, harus salah satu dari: 'pesanan_diterima', 'pesanan_diproses', 'pesanan_selesai', 'pesanan_dibatalkan'",
      }),
    },
  ),
});

const checkDateOrderStockSchema = z.object({
  order_date: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: "Tanggal tidak valid" }),
});

export {
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  checkDateOrderStockSchema,
};
