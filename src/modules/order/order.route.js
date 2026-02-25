import { Router } from "express";
import controller from "./order.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  authenticate,
  authorizeAdmin,
} from "../../middlewares/auth.middleware.js";
import { createOrderSchema } from "./order.schema.js";

const router = new Router();

// ----------- / / -----------
// TODO: Order
// ----------- / / -----------
router
  .route("/")
  .post(authenticate, validate(createOrderSchema), controller.createOrder);

export default router;
