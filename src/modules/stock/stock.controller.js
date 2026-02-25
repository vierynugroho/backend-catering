import stockOrderService from "./stock.service.js";
import {
  sendSuccess,
  sendError,
  sendWithPagination,
} from "../../common/response.js";

const getOrderStocks = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await stockOrderService.getOrderStocks(
      Number(page) || null,
      Number(limit) || null,
    );
    return sendWithPagination(
      res,
      result.orderStockWithMenu,
      result.pagination,
      "Data order stock berhasil diambil",
      200,
    );
  } catch (err) {
    next(err);
  }
};

const getOrderStockById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await stockOrderService.getOrderStockById(String(id));
    return sendSuccess(res, result, "Data order stock berhasil diambil", 200);
  } catch (err) {
    next(err);
  }
};

const createOrderStock = async (req, res, next) => {
  try {
    const { event_date, max_stock, current_stock } = req.body;

    const result = await stockOrderService.createOrderStock({
      event_date,
      max_stock,
      current_stock,
    });
    return sendSuccess(res, result, "Order stock berhasil dibuat", 201);
  } catch (err) {
    next(err);
  }
};

const updateOrderStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { event_date, max_stock, current_stock } = req.body;

    const result = await stockOrderService.updateOrderStock(String(id), {
      event_date,
      max_stock,
      current_stock,
    });
    return sendSuccess(res, result, "Order stock berhasil diperbarui", 200);
  } catch (err) {
    next(err);
  }
};

const deleteOrderStock = async (req, res, next) => {
  try {
    const { id } = req.params;

    await stockOrderService.deleteOrderStock(String(id));
    return sendSuccess(res, null, "Order stock berhasil dihapus", 200);
  } catch (err) {
    next(err);
  }
};

export default {
  getOrderStocks,
  getOrderStockById,
  createOrderStock,
  updateOrderStock,
  deleteOrderStock,
};
