import prisma from "../../config/db/prisma.js";
import { buildPagination } from "../../common/response.js";
import { setDate } from "../../utils/helpers.js";

const getOrderStocks = async (page, limit) => {
  const orderStockWithMenu = await prisma.stockOrder.findMany({
    take: limit ?? undefined,
    skip: page && limit ? (page - 1) * limit : undefined,
    orderBy: {
      eventDate: "desc",
    },
  });
  const orderStocksCount = await prisma.stockOrder.count();

  const pagination = buildPagination(orderStocksCount, page, limit);

  return {
    orderStockWithMenu,
    pagination,
  };
};

const getOrderStockById = async (id) => {
  const orderStock = await prisma.stockOrder.findUnique({
    where: { id },
  });

  if (!orderStock) {
    throw { statusCode: 400, message: "Order stock tidak ditemukan" };
  }

  return orderStock;
};

const createOrderStock = async (data) => {
  const { event_date, max_stock, current_stock } = data;

  const isExistingStockOrder = await prisma.stockOrder.findFirst({
    where: {
      eventDate: setDate(event_date),
    },
  });

  if (isExistingStockOrder) {
    throw {
      statusCode: 400,
      message: "Sudah ada order stock untuk tanggal tersebut",
    };
  }

  const newOrderStock = await prisma.stockOrder.create({
    data: {
      eventDate: setDate(event_date),
      maxStock: max_stock,
      currentStock: current_stock,
    },
  });

  return newOrderStock;
};

const updateOrderStock = async (id, data) => {
  const { event_date, max_stock, current_stock } = data;

  const isExistingStockOrder = await prisma.stockOrder.findFirst({
    where: {
      eventDate: setDate(event_date),
      NOT: {
        id: id,
      },
    },
  });

  if (!isExistingStockOrder) {
    throw { statusCode: 400, message: "Order stock tidak ditemukan" };
  }

  if (isExistingStockOrder) {
    throw {
      statusCode: 400,
      message: "Sudah ada order stock untuk tanggal tersebut",
    };
  }

  const updatedOrderStock = await prisma.stockOrder.update({
    where: { id },
    data: {
      eventDate: setDate(event_date),
      maxStock: max_stock,
      currentStock: current_stock,
    },
  });

  return updatedOrderStock;
};

const deleteOrderStock = async (id) => {
  const existingOrderStock = await prisma.stockOrder.findUnique({
    where: { id },
  });

  if (!existingOrderStock) {
    throw { statusCode: 400, message: "Order stock tidak ditemukan" };
  }

  await prisma.stockOrder.delete({
    where: { id },
  });
};

/**
 * Untuk memeriksa apakah stock order tersedia untuk tanggal tertentu
 * @param {*} date
 * @returns { is_available: boolean, out_of_stock: boolean }
 */
export const validateStockOrderMenu = async (date) => {
  const existingStockOrder = await prisma.stockOrder.findFirst({
    where: {
      eventDate: setDate(date),
    },
  });

  const outOfStock = existingStockOrder
    ? existingStockOrder.currentStock >= existingStockOrder.maxStock
    : false;

  return {
    is_available: existingStockOrder !== null,
    out_of_stock: outOfStock,
  };
};

export default {
  getOrderStocks,
  getOrderStockById,
  createOrderStock,
  updateOrderStock,
  deleteOrderStock,
};
