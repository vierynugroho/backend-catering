import prisma from "../../config/db/prisma.js";
import { buildPagination } from "../../common/response.js";
import { setDate } from "../../utils/helpers.js";

const getOrderStocks = async (filters) => {
  const { page, limit, search } = filters;
  const parsedPage = parseInt(page) || null;
  const parsedLimit = parseInt(limit) || null;
  const isPaginated = parsedPage && parsedLimit;

  const orderStockWithMenu = await prisma.stockOrder.findMany({
    ...(isPaginated && {
      take: parsedLimit,
      skip: (parsedPage - 1) * parsedLimit,
    }),
    where: {
      eventDate: search ? setDate(search) : undefined,
    },
    orderBy: {
      eventDate: "desc",
    },
  });

  if (!isPaginated) {
    return {
      orderStockWithMenu,
      pagination: null,
    };
  }

  const orderStocksCount = await prisma.stockOrder.count({
    where: {
      eventDate: search ? setDate(search) : undefined,
    },
  });

  const pagination = buildPagination(orderStocksCount, parsedPage, parsedLimit);

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

  const existingOrderStock = await prisma.stockOrder.findUnique({
    where: { id },
  });

  if (!existingOrderStock) {
    throw { statusCode: 400, message: "Order stock tidak ditemukan" };
  }

  const isExistingStockOrder = await prisma.stockOrder.findFirst({
    where: {
      eventDate: setDate(event_date),
      NOT: {
        id: id,
      },
    },
  });

  if (isExistingStockOrder) {
    throw {
      statusCode: 400,
      message: "Sudah ada order stock untuk tanggal tersebut",
    };
  }

  const effectiveMaxStock = max_stock ?? existingOrderStock.maxStock;
  if (effectiveMaxStock < existingOrderStock.currentStock) {
    throw {
      statusCode: 400,
      message: `Tidak dapat mengurangi max order menjadi ${effectiveMaxStock} karena sudah ada ${existingOrderStock.currentStock} pesanan aktif untuk tanggal ini`,
    };
  }

  const updatedOrderStock = await prisma.stockOrder.update({
    where: { id },
    data: {
      eventDate: setDate(event_date) || existingOrderStock.eventDate,
      maxStock: max_stock || existingOrderStock.maxStock,
      currentStock: current_stock || existingOrderStock.currentStock,
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

  if (existingOrderStock.currentStock > 0) {
    throw {
      statusCode: 400,
      message: `Tidak dapat menghapus order stock yang memiliki ${existingOrderStock.currentStock} pesanan aktif`,
    };
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
