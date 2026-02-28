import "dotenv/config";
import momentTZ from "moment-timezone";
momentTZ.tz.setDefault("UTC");

import express, { json, urlencoded } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import errorHandler from "./middlewares/error.middleware.js";

import authRoutes from "./modules/auth/auth.route.js";
import menuRoutes from "./modules/menu/menu.route.js";
import adminRoutes from "./modules/admin.routes.js";
import orderRoutes from "./modules/order/order.route.js";
import { authenticate, authorizeAdmin } from "./middlewares/auth.middleware.js";
// const shippingRoutes = require("./modules/shipping/shipping.routes");
// const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
// const userRoutes = require("./modules/users/user.routes");
// const stockRoutes = require("./modules/stock/stock.routes");

const app = express();

// ================================
// Security & Performance
// ================================
app.use(helmet());
app.use(compression()); // gzip compression
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api/", limiter);

// Auth rate limit lebih ketat
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
});

// ================================
// Body Parser
// ================================
app.use(json({ limit: "10mb" }));
app.use(urlencoded({ extended: true, limit: "10mb" }));

// ================================
// Logger
// ================================
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ================================
// Routes
// ================================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date(),
  });
});

app.use("/api/admin", authenticate, authorizeAdmin, adminRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/orders", orderRoutes);
// app.use("/api/shipping", shippingRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/stock", stockRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error Handler
app.use(errorHandler);

// ================================
// Start
// ================================
const PORT = process.env.PORT || 8088;
app.listen(PORT, () => {
  console.clear();
  console.log(
    `-----------/ ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} /-----------`,
  );
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

export default app;
