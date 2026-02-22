import { z } from "zod";

const createOrderSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(9, "No. telp tidak valid"),
  destination: z.string().min(5),
  eventDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: "Tanggal tidak valid" }),
  note: z.string().optional(),
  deliveryMethod: z.enum(["dikirim", "ambil_sendiri"]),
  items: z
    .array(
      z.object({
        menuId: z.string().cuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Minimal 1 item"),
});

const updateOrderStatusSchema = z.object({
  orderStatus: z.enum([
    "pesanan_diterima",
    "pesanan_diproses",
    "pesanan_selesai",
    "pesanan_dibatalkan",
  ]),
});

export default { createOrderSchema, updateOrderStatusSchema };
