import { z } from "zod";

const createUserSchema = z.object({
  fullname: z.string().min(2, "Fullname minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  customer_type: z.enum(["reguler_customer", "new_customer"], {
    required_error:
      "Tipe pelanggan wajib diisi, pilih antara 'reguler_customer' atau 'new_customer'",
  }),
  role: z.enum(["admin", "customer"], {
    required_error: "Role wajib diisi, pilih antara 'admin' atau 'customer'",
  }),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
});

const updateUserSchema = z.object({
  email: z.string().email("Email tidak valid").optional(),
  password: z.string().min(1, "Password wajib diisi").optional(),
  customer_type: z
    .enum(["reguler_customer", "new_customer"], {
      required_error:
        "Tipe pelanggan wajib diisi, pilih antara 'reguler_customer' atau 'new_customer'",
    })
    .optional(),
  role: z
    .enum(["admin", "customer"], {
      required_error: "Role wajib diisi, pilih antara 'admin' atau 'customer'",
    })
    .optional(),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit").optional(),
  address: z.string().min(5, "Alamat minimal 5 karakter").optional(),
});

const searchUserSchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
});

export { createUserSchema, updateUserSchema, searchUserSchema };
