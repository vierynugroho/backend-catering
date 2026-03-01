import z from "zod";
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

const validateQuery = (schema) => (req, res, next) => {
  const mergedSchema = Array.isArray(schema)
    ? schema.reduce((acc, s) => acc.merge(s), z.object({}))
    : schema;
  const result = mergedSchema.safeParse(req.query);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return sendError(res, "Validation failed", 422, errors);
  }
  req.query = result.data;
  next();
};

validate.query = validateQuery;

export default validate;
