import { Router } from "express";
import controller from "./stock.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { rangeDateSchema } from "../report/report.schema.js";

const router = new Router();

router
  .route("/calendar")
  .get(validate.query(rangeDateSchema), controller.getOrderStocks);

export default router;
