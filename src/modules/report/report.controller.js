import { sendSuccess } from "../../common/response.js";
import {
  customerReport,
  menuReport,
  orderReport,
  shippingReport,
  stockReport,
} from "./report.service.js";

const orderReports = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filters = { from, to };
    const userId = req.user ? req.user.id : null;
    const activeUserId = req.isAdmin ? null : userId;

    const reportData = await orderReport(filters, activeUserId);
    return sendSuccess(
      res,
      reportData,
      "Laporan pesanan berhasil diambil",
      200,
    );
  } catch (error) {
    next(error);
  }
};

const stockReports = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filters = { from, to };

    const reportData = await stockReport(filters);
    return sendSuccess(res, reportData, "Laporan stok berhasil diambil", 200);
  } catch (error) {
    next(error);
  }
};

const shippingReports = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filters = { from, to };
    const userId = req.user ? req.user.id : null;
    const activeUserId = req.isAdmin ? null : userId;

    const reportData = await shippingReport(filters, activeUserId);
    return sendSuccess(
      res,
      reportData,
      "Laporan pengiriman berhasil diambil",
      200,
    );
  } catch (error) {
    next(error);
  }
};

const menuReports = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filters = { from, to };
    const userId = req.user ? req.user.id : null;
    const activeUserId = req.isAdmin ? null : userId;

    const reportData = await menuReport(filters, activeUserId);
    return sendSuccess(res, reportData, "Laporan menu berhasil diambil", 200);
  } catch (error) {
    next(error);
  }
};

const customerReports = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filters = { from, to };

    const reportData = await customerReport(filters);
    return sendSuccess(
      res,
      reportData,
      "Laporan pelanggan berhasil diambil",
      200,
    );
  } catch (error) {
    next(error);
  }
};

export default {
  orderReports,
  stockReports,
  shippingReports,
  menuReports,
  customerReports,
};
