import { validateStockOrderMenu } from "../stock/stock.service.js";
import menuService from "../menu/menu.service.js";
import prisma from "../../config/db/prisma.js";
import {
  formatDateResponse,
  formatPhoneNumber,
  formatWIBDateTime,
  generateOrderCode,
  getCurrentDateWIB,
  setToWIB,
} from "../../utils/helpers.js";

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
    current_time: getCurrentDateWIB(),
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
      current_WIB: getCurrentDateWIB(),
      payload,
      totalPerItem,
      totalPrice,
      discount,
    },
    { depth: null },
  );

  return await prisma.$transaction(async (prisma) => {
    await prisma.order.create({
      data: {
        customerName: payload.customer_name,
        phone: payload.phone,
        destination: payload.destination,
        eventDate: formatWIBDateTime(payload.order_date),
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
        createdAt: formatWIBDateTime(setToWIB(new Date())),
        updatedAt: formatWIBDateTime(setToWIB(new Date())),
      },
    });

    await prisma.stockOrder.updateMany({
      where: {
        eventDate: setToWIB(orderDate),
      },
      data: {
        currentStock: {
          increment: 1,
        },
        updatedAt: formatWIBDateTime(setToWIB(new Date())),
      },
    });
  });
};

export default { validateOrderStock, createOrder };
