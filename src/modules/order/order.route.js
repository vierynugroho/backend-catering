import { Router } from "express";
import controller from "./order.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  authenticate,
  authorizeCustomer,
} from "../../middlewares/auth.middleware.js";
import {
  checkDateOrderStockSchema,
  createOrderSchema,
  orderQuerySchema,
} from "./order.schema.js";
import { rangeDateSchema } from "../report/report.schema.js";

const router = new Router();

// ----------- / / -----------
// TODO: Order
// ----------- / / -----------

router
  .route("/check-date-order-stock")
  .post(validate(checkDateOrderStockSchema), controller.checkDateOrderStock);

router
  .route("/")
  .post(authenticate, validate(createOrderSchema), controller.createOrder)
  .get(
    authenticate,
    authorizeCustomer,
    validate.query([rangeDateSchema, orderQuerySchema]),
    controller.getOrders,
  );

router
  .route("/:id")
  .get(authenticate, authorizeCustomer, controller.getOrderById);

export default router;
