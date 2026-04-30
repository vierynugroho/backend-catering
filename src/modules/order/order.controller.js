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
    const {
      page,
      limit,
      search,
      shipping_status,
      order_status,
      delivery_method,
    } = req.query;
    const userId = req.user.id;
    const isAdmin = req.isAdmin ?? false;
    const filters = {
      search,
      shipping_status,
      order_status,
      delivery_method,
      isAdmin,
      userId,
      page: Number(page) || null,
      limit: Number(limit) || null,
    };
    const { orders, pagination } = await orderService.getOrders(filters);

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

const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      customer_name,
      phone,
      destination,
      order_date,
      note,
      delivery_method,
      order_status,
      items,
      shipping_cost,
      shipping_status,
      discount,
    } = req.body;

    const result = await orderService.updateOrder(id, {
      userId: req.user.id,
      customerName: customer_name,
      phone,
      destination,
      orderDate: order_date,
      note,
      orderStatus: order_status,
      deliveryMethod: delivery_method,
      items,
      shippingCost: shipping_cost,
      shippingStatus: shipping_status,
      discount,
    });

    return sendSuccess(res, result, "Order berhasil diperbarui", 200);
  } catch (err) {
    next(err);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    await orderService.deleteOrder(id);

    return sendSuccess(res, null, "Order berhasil dihapus");
  } catch (err) {
    next(err);
  }
};

const exportOrders = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      shipping_status,
      order_status,
      delivery_method,
      from,
      to,
    } = req.query;
    const isAdmin = req.isAdmin ?? false;
    const userId = isAdmin ? req.user?.id : undefined;
    const { type } = req.params;
    const filters = {
      search,
      shipping_status,
      order_status,
      delivery_method,
      from,
      to,
      isAdmin,
      userId,
      page: Number(page) || null,
      limit: Number(limit) || null,
    };
    const data = await orderService.exportOrders(filters, type);

    const lowerType = type ? type.toLowerCase() : null;

    if (lowerType === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="orders_${Date.now()}.csv"`,
      );
      return res.send(data);
    }

    if (lowerType === "xlsx") {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="orders_${Date.now()}.xlsx"`,
      );
      return res.send(data);
    }

    if (lowerType === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="orders_${Date.now()}.pdf"`,
      );
      return res.send(data);
    }

    return sendSuccess(res, data, "Data order berhasil diekspor");
  } catch (err) {
    next(err);
  }
};

const validateInvoiceDownload = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await orderService.validateInvoiceDownload(id);

    return sendSuccess(res, result, "Validasi invoice berhasil");
  } catch (err) {
    next(err);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { buffer, code } = await orderService.getInvoicePDF(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice_${code}_${Date.now()}.pdf"`,
    );
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const confirmOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await orderService.confirmOrder(id);

    return sendSuccess(res, result, "Order berhasil dikonfirmasi");
  } catch (err) {
    next(err);
  }
};

export default {
  createOrder,
  checkDateOrderStock,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  exportOrders,
  validateInvoiceDownload,
  downloadInvoice,
  confirmOrder,
};
