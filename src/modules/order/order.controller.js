import { sendSuccess } from "../../common/response.js";
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

export default {
  createOrder,
};
