import { validateStockOrderMenu } from "../stock/stock.service.js";
import menuService from "../menu/menu.service.js";
import prisma from "../../config/db/prisma.js";
import {
  formatDateResponse,
  formatPhoneNumber,
  setWIBDateTime,
  generateOrderCode,
  setWIBDate,
} from "../../utils/helpers.js";
import { buildPagination } from "../../common/response.js";

export const calculateOrderItems = (items) => {
  const discount = 0;

  const totalPerItem = items.map((item) => {
    const subtotal = Number(item.quantity) * Number(item.price);
    return {
      menu_id: item.menu_id,
      quantity: item.quantity,
      subtotal,
    };
  });

  const totalPrice =
    totalPerItem.reduce((total, row) => total + row.subtotal, 0) - discount;

  return {
    totalPerItem,
    totalPrice,
    discount,
  };
};

const validateOrderStock = async (items, orderDate) => {
  const insufficientStockItems = [];

  for (const item of items) {
    const { menu_id: menuId } = item;
    const menu = await menuService.getMenuById(menuId);

    if (!menu) {
      insufficientStockItems.push({
        menu: { name: "Menu tidak ditemukan" },
        reason: "Menu tidak ditemukan",
      });
      continue;
    }

    const { is_available, out_of_stock } =
      await validateStockOrderMenu(orderDate);

    console.log({
      orderDate,
      is_available,
      out_of_stock,
    });

    if (!is_available) {
      insufficientStockItems.push({
        reason: `Mohon maaf, stock order untuk tanggal ${formatDateResponse(orderDate)} belum tersedia. Silakan pilih tanggal lain atau hubungi admin untuk informasi lebih lanjut.`,
      });
      continue;
    }

    if (out_of_stock) {
      insufficientStockItems.push({
        reason: `Mohon maaf, kami sedang pesanan untuk tanggal ${formatDateResponse(orderDate)} telah melampaui batas maksimal. Silakan pilih tanggal lain.`,
      });
      continue;
    }
  }

  if (insufficientStockItems.length > 0) {
    const errorMessage = insufficientStockItems
      .map((item) => `${item.reason}`)
      .join("; ");
    throw { statusCode: 400, message: errorMessage };
  }
};

const checkDateOrderStock = async (orderDate) => {
  const { is_available, out_of_stock } =
    await validateStockOrderMenu(orderDate);

  return {
    is_available,
    out_of_stock,
  };
};

const createOrder = async ({
  userId,
  customerName,
  phone,
  destination,
  orderDate,
  note,
  deliveryMethod,
  items,
}) => {
  await validateOrderStock(items, orderDate);

  const payload = {
    user_id: userId,
    customer_name: customerName,
    phone: formatPhoneNumber(phone),
    destination,
    order_date: orderDate,
    note,
    code: generateOrderCode(),
    delivery_method: deliveryMethod,
    items: items.map((item) => ({
      menu_id: item.menu_id,
      quantity: item.quantity,
    })),
  };

  let itemsWithPrice = [];
  for (const item of items) {
    const menu = await menuService.getMenuById(item.menu_id);
    if (!menu) {
      throw {
        statusCode: 400,
        message: `Menu dengan ID ${item.menu_id} tidak ditemukan`,
      };
    }
    itemsWithPrice.push({
      ...item,
      price: menu.price,
    });
  }

  const { totalPerItem, totalPrice, discount } =
    calculateOrderItems(itemsWithPrice);

  console.dir(
    {
      payload,
      totalPerItem,
      totalPrice,
      discount,
    },
    { depth: null },
  );

  return await prisma.$transaction(async (prisma) => {
    const newOrder = await prisma.order.create({
      data: {
        customerName: payload.customer_name,
        phone: payload.phone,
        destination: payload.destination,
        eventDate: setWIBDateTime(payload.order_date),
        note: payload.note,
        userId: payload.user_id,
        code: payload.code,
        totalPrice: totalPrice,
        deliveryMethod: payload.delivery_method,
        orderItems: {
          create: payload.items.map((item) => ({
            menuId: item.menu_id,
            quantity: item.quantity,
            subtotal:
              totalPerItem.find((i) => i.menu_id === item.menu_id)?.subtotal ||
              0,
          })),
        },
        createdAt: setWIBDateTime(new Date()),
        updatedAt: setWIBDateTime(new Date()),
      },
    });

    await prisma.stockOrder.updateMany({
      where: {
        eventDate: setWIBDate(orderDate),
      },
      data: {
        currentStock: {
          increment: 1,
        },
        updatedAt: setWIBDateTime(new Date()),
      },
    });
    return newOrder;
  });
};

const getOrders = async (page, limit) => {
  const orders = await prisma.order.findMany({
    take: limit ?? undefined,
    skip: page && limit ? (page - 1) * limit : undefined,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      orderItems: {
        include: {
          menu: true,
        },
      },
    },
  });

  const totalOrders = await prisma.order.count();

  const mappedOrders = orders.map((order) => ({
    id: order.id,
    customer_name: order.customerName,
    ordered_by: {
      fullname: order.user ? order.user.fullname : null,
      email: order.user ? order.user.email : null,
    },
    phone: order.phone,
    destination: order.destination,
    order_date: formatDateResponse(order.eventDate),
    note: order.note,
    code: order.code,
    total_price: order.totalPrice,
    delivery_method: order.deliveryMethod,
    items: order.orderItems.map((item) => ({
      menu_id: item.menuId,
      menu_name: item.menu.name,
      menu_price: item.menu.price,
      menu_images: item.menu.images ? JSON.parse(item.menu.images) : [],
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
  }));

  const pagination = buildPagination(totalOrders, page, limit);
  return {
    orders: mappedOrders,
    pagination,
  };
};

export default {
  validateOrderStock,
  createOrder,
  checkDateOrderStock,
  getOrders,
};
