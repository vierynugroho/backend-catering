import z from "zod";

const rangeDateSchema = z.object({
  from: z.coerce.string().datetime().optional(),
  to: z.coerce.string().datetime().optional(),
});

export { rangeDateSchema };
