import { sendSuccess, sendWithPagination } from "../../common/response.js";
import orderService from "./order.service.js";

const createOrder = async (req, res, next) => {
  try {
    const {
      customer_name,
      phone,
      destination,
      order_date,
      note,
      delivery_method,
      items,
    } = req.body;

    const result = await orderService.createOrder({
      userId: req.user.id,
      customerName: customer_name,
      phone,
      destination,
      orderDate: order_date,
      note,
      deliveryMethod: delivery_method,
      items,
    });

    return sendSuccess(res, result, "Order berhasil dibuat", 201);
  } catch (err) {
    next(err);
  }
};

const checkDateOrderStock = async (req, res, next) => {
  try {
    const { order_date } = req.body;

    const result = await orderService.checkDateOrderStock(order_date);

    return sendSuccess(res, result, "Cek ketersediaan stock order berhasil");
  } catch (err) {
    next(err);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const userId = req.user.id;
    const isAdmin = req.isAdmin ?? false;
    const { orders, pagination } = await orderService.getOrders(
      Number(page) || null,
      Number(limit) || null,
      userId,
      isAdmin,
    );

    return sendWithPagination(
      res,
      orders,
      pagination,
      "Daftar order berhasil diambil",
    );
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.isAdmin ?? false;
    const order = await orderService.getOrderById(id, userId, isAdmin);

    return sendSuccess(res, order, "Detail order berhasil diambil");
  } catch (err) {
    next(err);
  }
};


export default {
  createOrder,
  checkDateOrderStock,
  getOrders,
  getOrderById,
};
