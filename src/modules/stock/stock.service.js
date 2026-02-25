import prisma from "../../config/db/prisma.js";
import { buildPagination } from "../../common/response.js";
import { setToWIB } from "../../utils/helpers.js";

const getOrderStocks = async (page, limit) => {
  const orderStockWithMenu = await prisma.stockOrder.findMany({
    take: limit ?? undefined,
    skip: page && limit ? (page - 1) * limit : undefined,
    include: {
      menu: true,
    },
  });

  const pagination = buildPagination(orderStockWithMenu.length, page, limit);

  return {
    orderStockWithMenu,
    pagination,
  };
};

const getOrderStockById = async (id) => {
  const orderStock = await prisma.stockOrder.findUnique({
    where: { id },
    include: {
      menu: true,
    },
  });

  if (!orderStock) {
    throw { statusCode: 400, message: "Order stock tidak ditemukan" };
  }

  return orderStock;
};

const createOrderStock = async (data) => {
  const { event_date, menu_id, max_stock, current_stock } = data;

  const isExistingStockOrder = await prisma.stockOrder.findFirst({
    where: {
      eventDate: setToWIB(event_date),
      menuId: menu_id,
    },
  });

  if (isExistingStockOrder) {
    throw {
      statusCode: 400,
      message: "Sudah ada order stock untuk tanggal dan menu tersebut",
    };
  }

  const newOrderStock = await prisma.stockOrder.create({
    data: {
      eventDate: setToWIB(event_date),
      menuId: menu_id,
      maxStock: max_stock,
      currentStock: current_stock,
    },
  });

  return newOrderStock;
};

const updateOrderStock = async (id, data) => {
  const { event_date, menu_id, max_stock, current_stock } = data;

  const isExistingStockOrder = await prisma.stockOrder.findFirst({
    where: {
      eventDate: setToWIB(event_date),
      menuId: menu_id,
      NOT: {
        id: id,
      },
    },
  });

  if (isExistingStockOrder) {
    throw {
      statusCode: 400,
      message: "Sudah ada order stock untuk tanggal dan menu tersebut",
    };
  }

  const updatedOrderStock = await prisma.stockOrder.update({
    where: { id },
    data: {
      eventDate: setToWIB(event_date),
      menuId: menu_id,
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
 * Untuk memeriksa apakah menu tersedia untuk tanggal tertentu dan apakah stok sudah habis
 * @param {*} date
 * @param {*} menuId
 * @returns { is_available: boolean, out_of_stock: boolean }
 */
export const validateStockOrderMenu = async (date, menuId) => {
  const existingStockOrder = await prisma.stockOrder.findFirst({
    where: {
      eventDate: setToWIB(date),
      menuId: menuId,
    },
  });

  const outOfStock = existingStockOrder
    ? existingStockOrder.currentStock >= existingStockOrder.maxStock
    : false;

  return {
    is_available: !existingStockOrder || !outOfStock,
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
