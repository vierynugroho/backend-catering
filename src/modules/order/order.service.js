import { validateStockOrderMenu } from "../stock/stock.service.js";
import menuService from "../menu/menu.service.js";
import prisma from "../../config/db/prisma.js";
import {
  formatDateResponse,
  formatPhoneNumber,
  setWIBDateTime,
  generateOrderCode,
  setWIBDate,
  getTodayWIB,
  formatDateResponseNoTZ,
} from "../../utils/helpers.js";
import { buildPagination } from "../../common/response.js";
import moment from "moment";

export const calculateOrderItems = (items, shippingCost = 0) => {
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
    totalPerItem.reduce((total, row) => total + row.subtotal, 0) -
    discount +
    shippingCost;

  return {
    totalPerItem,
    totalPrice,
    discount,
  };
};

const validateOrderStock = async (items, orderDate, isUpdate = false) => {
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

    if (!isUpdate) {
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
        eventDate: setWIBDateTime(payload.order_date),
        note: payload.note,
        userId: payload.user_id,
        code: payload.code,
        totalPrice: totalPrice,
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

    await prisma.shipping.create({
      data: {
        orderId: newOrder.id,
        destination: payload.destination,
        recipientName: payload.customer_name,
        recipientPhone: payload.phone,
        deliveryMethod: payload.delivery_method,
        deliveredAt: setWIBDateTime(payload.order_date),
        createdAt: setWIBDateTime(new Date()),
        updatedAt: setWIBDateTime(new Date()),
      },
    });
    return newOrder;
  });
};

const getOrders = async (page, limit, userId, isAdmin) => {
  const orders = await prisma.order.findMany({
    take: limit ?? undefined,
    skip: page && limit ? (page - 1) * limit : undefined,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      userId: isAdmin ? undefined : userId,
    },
    include: {
      user: true,
      orderItems: {
        include: {
          menu: true,
        },
      },
      shipping: true,
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
    phone: order.shipping ? order.shipping.recipientPhone : null,
    destination: order.shipping ? order.shipping.destination : null,
    order_date: formatDateResponseNoTZ(order.eventDate, true),
    note: order.note,
    code: order.code,
    order_status: order.orderStatus,
    shipping_cost: order.shipping ? order.shipping.shippingCost : 0,
    total_price: order.totalPrice,
    delivery_method: order.shipping ? order.shipping.deliveryMethod : null,
    delivered_at: order.shipping
      ? formatDateResponseNoTZ(order.shipping.deliveredAt, true)
      : null,
    shipping_status: order.shipping
      ? order.shipping.shippingStatus
      : "pesanan_disiapkan",
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

const getOrderById = async (id, userId, isAdmin) => {
  const order = await prisma.order.findFirst({
    where: {
      id: id,
      userId: isAdmin ? undefined : userId,
    },
    include: {
      user: true,
      orderItems: {
        include: {
          menu: true,
        },
      },
      shipping: true,
    },
  });

  if (!order) {
    throw {
      statusCode: 404,
      message: "Order tidak ditemukan",
    };
  }

  const mappedOrder = {
    id: order.id,
    customer_name: order.customerName,
    ordered_by: {
      fullname: order.user ? order.user.fullname : null,
      email: order.user ? order.user.email : null,
    },
    phone: order.shipping ? order.shipping.recipientPhone : null,
    destination: order.shipping ? order.shipping.destination : null,
    order_date: formatDateResponseNoTZ(order.eventDate, true),
    note: order.note,
    code: order.code,
    order_status: order.orderStatus,
    total_price: order.totalPrice,
    shipping_cost: order.shipping ? order.shipping.shippingCost : 0,
    delivery_method: order.shipping ? order.shipping.deliveryMethod : null,
    delivered_at: order.shipping
      ? formatDateResponseNoTZ(order.shipping.deliveredAt, true)
      : null,
    shipping_status: order.shipping
      ? order.shipping.shippingStatus
      : "pesanan_disiapkan",
    items: order.orderItems.map((item) => ({
      menu_id: item.menuId,
      menu_name: item.menu.name,
      menu_price: item.menu.price,
      menu_images: item.menu.images ? JSON.parse(item.menu.images) : [],
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
  };

  return mappedOrder || null;
};

const updateOrder = async (
  id,
  {
    userId,
    customerName,
    phone,
    destination,
    orderDate,
    note,
    deliveryMethod,
    orderStatus,
    items,
    shippingCost,
    shippingStatus,
  },
) => {
  const existingOrder = await getOrderById(id, userId, true);

  await validateOrderStock(items, orderDate, true);

  const payload = {
    user_id: userId,
    customer_name: customerName,
    phone: formatPhoneNumber(phone),
    destination,
    order_date: orderDate,
    shipping_cost: shippingCost || 0,
    note,
    code: generateOrderCode(),
    delivery_method: deliveryMethod,
    order_status: orderStatus || existingOrder.order_status,
    items: items.map((item) => ({
      menu_id: item.menu_id,
      quantity: item.quantity,
    })),
  };

  // jika status order pesanan_diproses, jangan izinkan update tanggal atau ubah status menjadi pesanan_diterima atau pesanan_dibatalkan
  if (
    existingOrder.order_status === "pesanan_diproses" &&
    (payload.order_status === "pesanan_diterima" ||
      payload.order_status === "pesanan_dibatalkan" ||
      !moment(setWIBDate(existingOrder.order_date)).isSame(
        setWIBDate(payload.order_date),
        "day",
      ))
  ) {
    throw {
      statusCode: 400,
      message:
        "Tidak dapat mengubah status menjadi pesanan_diterima atau pesanan_dibatalkan atau mengubah tanggal order karena status order saat ini adalah pesanan_diproses",
    };
  }

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

  const { totalPerItem, totalPrice } = calculateOrderItems(
    itemsWithPrice,
    shippingCost,
  );

  // update stock jika order date diubah dan order date lama belum lewat atau merupakan order baru, atau jika status order diubah menjadi pesanan_diterima atau pesanan_dibatalkan
  const existingOrderDate = setWIBDate(existingOrder.order_date);
  const newOrderDate = setWIBDate(orderDate);

  return await prisma.$transaction(async (prisma) => {
    if (
      !moment(existingOrderDate).isSame(newOrderDate, "day") ||
      payload.order_status === "pesanan_diterima" ||
      payload.order_status === "pesanan_dibatalkan"
    ) {
      const today = getTodayWIB().start;

      if (
        existingOrderDate >= today ||
        existingOrder.order_status === "pesanan_dibatalkan"
      ) {
        await prisma.stockOrder.updateMany({
          where: {
            eventDate: existingOrderDate,
          },
          data: {
            currentStock: {
              decrement: 1,
            },
            updatedAt: setWIBDateTime(new Date()),
          },
        });

        await prisma.stockOrder.updateMany({
          where: {
            eventDate: newOrderDate,
          },
          data: {
            currentStock: {
              increment: 1,
            },
            updatedAt: setWIBDateTime(new Date()),
          },
        });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        eventDate: setWIBDateTime(payload.order_date),
        note: payload.note,
        userId: payload.user_id,
        code: payload.code,
        totalPrice,
        orderStatus: payload.order_status,
        orderItems: {
          update: payload.items.map((item) => ({
            where: { orderId_menuId: { orderId: id, menuId: item.menu_id } },
            data: {
              menuId: item.menu_id,
              quantity: item.quantity,
              subtotal:
                totalPerItem.find((i) => i.menu_id === item.menu_id)
                  ?.subtotal ?? 0,
            },
          })),
        },

        updatedAt: setWIBDateTime(new Date()),
      },
    });

    await prisma.shipping.updateMany({
      where: {
        orderId: id,
      },
      data: {
        destination: payload.destination,
        recipientName: payload.customer_name,
        recipientPhone: payload.phone,
        deliveryMethod: payload.delivery_method,
        shippingStatus:
          payload.order_status === "pesanan_dibatalkan"
            ? "pesanan_dibatalkan"
            : shippingStatus || existingOrder.shipping_status,
        deliveredAt: setWIBDateTime(payload.order_date),
        shippingCost: payload.shipping_cost,
        updatedAt: setWIBDateTime(new Date()),
      },
    });

    return updatedOrder;
  });
};

const deleteOrder = async (id) => {
  const existingOrder = await getOrderById(id, null, true);

  if (existingOrder.order_status === "pesanan_diproses") {
    throw {
      statusCode: 400,
      message: "Tidak dapat menghapus order dengan status pesanan_diproses",
    };
  }

  const today = getTodayWIB().start;
  // jika order hari ini atau belum lewat atau merupakan order baru, kembalikan stock (increment 1)
  if (
    existingOrder.eventDate >= today ||
    existingOrder.order_status === "pesanan_diterima"
  ) {
    await prisma.stockOrder.updateMany({
      where: {
        eventDate: setWIBDate(existingOrder.eventDate),
      },
      data: {
        currentStock: {
          increment: 1,
        },
        updatedAt: setWIBDateTime(new Date()),
      },
    });
  }

  const deletedOrder = await prisma.$transaction(async (prisma) => {
    await prisma.shipping.deleteMany({
      where: {
        orderId: id,
      },
    });

    await prisma.orderItem.deleteMany({
      where: {
        orderId: id,
      },
    });

    await prisma.order.delete({
      where: {
        id,
      },
    });
  });

  return deletedOrder;
};

export default {
  validateOrderStock,
  checkDateOrderStock,
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
