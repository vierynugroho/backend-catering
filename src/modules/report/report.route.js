import { Router } from "express";
import controller from "./report.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { reportQuerySchema } from "./report.schema.js";

const router = new Router();

router
  .route("/order")
  .get(
    authenticate,
    validate.query(reportQuerySchema),
    controller.orderReports,
  );
router
  .route("/stock")
  .get(
    authenticate,
    validate.query(reportQuerySchema),
    controller.stockReports,
  );
router
  .route("/shipping")
  .get(
    authenticate,
    validate.query(reportQuerySchema),
    controller.shippingReports,
  );
router
  .route("/menu")
  .get(authenticate, validate.query(reportQuerySchema), controller.menuReports);
router
  .route("/customer")
  .get(
    authenticate,
    validate.query(reportQuerySchema),
    controller.customerReports,
  );

export default router;
