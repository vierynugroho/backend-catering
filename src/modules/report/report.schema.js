import z from "zod";

const rangeDateSchema = z.object({
  from: z.coerce.string().datetime().optional(),
  to: z.coerce.string().datetime().optional(),
  category_id: z.coerce.string().optional(),
});

export { rangeDateSchema };
