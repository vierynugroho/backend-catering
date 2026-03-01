import z from "zod";

const reportQuerySchema = z.object({
  from: z.coerce.string().datetime().optional(),
  to: z.coerce.string().datetime().optional(),
});

export { reportQuerySchema };
