import { verifyToken } from "../utils/jwt.js";
import { sendError } from "../common/response.js";

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Unauthorized - No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, "Unauthorized - Invalid token", 401);
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return sendError(res, "Forbidden - Admin only", 403);
  }
  next();
};

const authorizeCustomer = (req, res, next) => {
  if (req.user?.role !== "customer") {
    return sendError(res, "Forbidden - Customer only", 403);
  }
  next();
};

export { authenticate, authorizeAdmin, authorizeCustomer };
