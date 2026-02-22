import { sendError } from "../common/response.js";

const errorHandler = (err, req, res, next) => {
  console.error("[ERROR]", err);

  // Prisma errors
  if (err.code === "P2002") {
    return sendError(res, "Data already exists (unique constraint)", 409);
  }
  if (err.code === "P2025") {
    return sendError(res, "Record not found", 404);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token", 401);
  }
  if (err.name === "TokenExpiredError") {
    return sendError(res, "Token expired", 401);
  }

  return sendError(
    res,
    err.message || "Internal Server Error",
    err.statusCode || 500,
  );
};

export default errorHandler;
