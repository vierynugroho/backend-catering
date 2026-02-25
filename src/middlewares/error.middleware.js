import { sendError } from "../common/response.js";
import { deleteFromImageKit } from "../lib/imageKit.js";

/**
 * Custom API error class to standardize error handling across the application.
 */
export class APIError extends Error {
  /**
   * 
   * @param {*} message 
   * @param {*} statusCode 
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode ?? 500;
  }
}

const errorHandler = (err, req, res, next) => {
  console.error("[ERROR]", err);
  const uploadedFileIds =
    req.uploadedImages && req.uploadedImages.map((img) => img.fileId);

  if (uploadedFileIds && uploadedFileIds.length > 0) {
    uploadedFileIds.forEach((fileId) => {
      console.log("deleting file from ImageKit due to error:", fileId);
      deleteFromImageKit(fileId).catch((deleteError) => {
        console.error(
          `Failed to delete file ${fileId} from ImageKit:`,
          deleteError,
        );
      });
    });
  }


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
