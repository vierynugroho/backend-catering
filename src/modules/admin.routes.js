import { Router } from "express";
import menuController from "./menu/menu.controller.js";
import userController from "./user/user.controller.js";
import stockController from "./stock/stock.controller.js";
import orderController from "./order/order.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createStockSchema,
  searchStockSchema,
  updateStockSchema,
} from "./stock/stock.schema.js";
import {
  createUserSchema,
  searchUserSchema,
  updateUserSchema,
} from "./user/user.schema.js";
import {
  authenticate,
  authorizeAdmin,
} from "../middlewares/auth.middleware.js";
import { orderQuerySchema, updateOrderSchema } from "./order/order.schema.js";
import { rangeDateSchema } from "./report/report.schema.js";

const router = new Router();

// ----------- / / -----------
// TODO: Menu
// ----------- / / -----------
router
  .route("/menus")
  .get(validate.query(rangeDateSchema), menuController.getMenus);
router.route("/menus/:id").get(menuController.getMenuById);

// ----------- / / -----------
// TODO: Stock
// ----------- / / -----------
router
  .route("/order-stocks")
  .get(
    validate.query([rangeDateSchema, searchStockSchema]),
    stockController.getOrderStocks,
  )
  .post(validate(createStockSchema), stockController.createOrderStock);
router.route("/order-stocks/:id")
  .get(stockController.getOrderStockById)
  .put(validate(updateStockSchema),stockController.updateOrderStock)
  .delete(stockController.deleteOrderStock);

// ----------- / / -----------
// TODO: Users
// ----------- / / -----------
router
  .route("/users")
  .get(
    validate.query([rangeDateSchema, searchUserSchema]),
    userController.getUsers,
  )
  .post(validate(createUserSchema), userController.createUser);
router
  .route("/users/:id")
  .get(userController.getUserById)
  .put(validate(updateUserSchema), userController.updateUser)
  .delete(userController.deleteUser);

// ----------- / / -----------
// TODO: Order
// ----------- / / -----------
router
  .route("/orders")
  .get(
    authenticate,
    authorizeAdmin,
    validate.query([rangeDateSchema, orderQuerySchema]),
    orderController.getOrders,
  );
router
  .route("/orders/:id")
  .get(authenticate, authorizeAdmin, orderController.getOrderById)
  .put(
    authenticate,
    authorizeAdmin,
    validate(updateOrderSchema),
    orderController.updateOrder,
  )
  .delete(authenticate, authorizeAdmin, orderController.deleteOrder);

export default router;
