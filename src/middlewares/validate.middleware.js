import { sendError } from "../common/response.js";

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return sendError(res, "Validation failed", 422, errors);
  }
  req.body = result.data;
  next();
};

export default validate;
