import { validateStockOrderMenu } from "../stock/stock.service.js";
import menuService from "../menu/menu.service.js";
import prisma from "../../config/db/prisma.js";
import {
  formatDateResponse,
  formatDateWIB,
  formatPhoneNumber,
  setDateTime,
  generateOrderCode,
  setDate,
  getToday,
} from "../../utils/helpers.js";
import { buildPagination } from "../../common/response.js";
import moment from "moment";
import exporter from "../../utils/exporter.js";
import { CustomerType } from "@prisma/client";

export const calculateOrderItems = (items, shippingCost = 0, discount = 0) => {
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

  if (totalPrice < 0) {
    throw {
      statusCode: 400,
      message:
        "Total harga tidak boleh negatif, pastikan diskon tidak melebihi total harga sebelum diskon",
    };
  }

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

  return await prisma.$transaction(async (prisma) => {
    const newOrder = await prisma.order.create({
      data: {
        eventDate: setDateTime(payload.order_date),
        note: payload.note,
        userId: payload.user_id,
        code: payload.code,
        totalPrice: totalPrice,
        discount: discount,
        orderItems: {
          create: payload.items.map((item) => ({
            menuId: item.menu_id,
            quantity: item.quantity,
            subtotal:
              totalPerItem.find((i) => i.menu_id === item.menu_id)?.subtotal ||
              0,
          })),
        },
        createdAt: setDateTime(new Date()),
        updatedAt: setDateTime(new Date()),
      },
    });

    await prisma.stockOrder.updateMany({
      where: {
        eventDate: setDate(orderDate),
      },
      data: {
        currentStock: {
          increment: 1,
        },
        updatedAt: setDateTime(new Date()),
      },
    });

    await prisma.shipping.create({
      data: {
        orderId: newOrder.id,
        destination: payload.destination,
        recipientName: payload.customer_name,
        recipientPhone: payload.phone,
        deliveryMethod: payload.delivery_method,
        deliveredAt: setDateTime(payload.order_date),
        createdAt: setDateTime(new Date()),
        updatedAt: setDateTime(new Date()),
      },
    });

    // user order, if >= 5, update to reguler_customer
    const countUserOrder = await prisma.order.count({
      where: {
        userId: userId,
      },
    });

    if (countUserOrder >= 5) {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          customerType: CustomerType.reguler_customer,
          updatedAt: setDateTime(new Date()),
        },
      });
    }

    return newOrder;
  });
};

const getOrders = async (filters) => {
  const {
    page,
    limit,
    userId,
    isAdmin,
    search,
    shipping_status,
    order_status,
    delivery_method,
  } = filters;
  const orders = await prisma.order.findMany({
    take: limit ?? undefined,
    skip: page && limit ? (page - 1) * limit : undefined,
    orderBy: [
      { eventDate: "desc" }, // prioritas 1
      { createdAt: "desc" }, // prioritas 2 (tie-breaker)
    ],
    where: {
      userId: isAdmin ? undefined : userId,
      orderStatus: order_status ?? undefined,
      shipping: {
        shippingStatus: shipping_status ?? undefined,
        deliveryMethod: delivery_method ?? undefined,
      },
      OR: search
        ? [
            { user: { fullname: { contains: search, mode: "insensitive" } } },
            { code: { contains: search, mode: "insensitive" } },
            {
              shipping: {
                recipientName: search
                  ? { contains: search, mode: "insensitive" }
                  : undefined,
                recipientPhone: search
                  ? { contains: search, mode: "insensitive" }
                  : undefined,
              },
            },
          ]
        : undefined,
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

  const totalOrders = await prisma.order.count({
    where: {
      userId: isAdmin ? undefined : userId,
      orderStatus: order_status ?? undefined,
      shipping: {
        shippingStatus: shipping_status ?? undefined,
        deliveryMethod: delivery_method ?? undefined,
      },
      OR: search
        ? [
            { user: { fullname: { contains: search, mode: "insensitive" } } },
            { code: { contains: search, mode: "insensitive" } },
            {
              shipping: {
                recipientName: search
                  ? { contains: search, mode: "insensitive" }
                  : undefined,
                recipientPhone: search
                  ? { contains: search, mode: "insensitive" }
                  : undefined,
              },
            },
          ]
        : undefined,
    },
  });

  const mappedOrders = orders.map((order) => ({
    id: order.id,
    customer_name: order.shipping.recipientName,
    ordered_by: {
      fullname: order.user ? order.user.fullname : null,
      email: order.user ? order.user.email : null,
    },
    phone: order.shipping ? order.shipping.recipientPhone : null,
    destination: order.shipping ? order.shipping.destination : null,
    note: order.note,
    code: order.code,
    order_date: order.eventDate,
    order_status: order.orderStatus,
    shipping_cost: order.shipping ? parseFloat(order.shipping.shippingCost) : 0,
    total_price: parseFloat(order.totalPrice),
    discount: parseFloat(order.discount),
    normal_price: parseFloat(order.totalPrice) + parseFloat(order.discount),
    final_price: parseFloat(order.totalPrice),
    delivery_method: order.shipping ? order.shipping.deliveryMethod : null,
    delivered_at: order.shipping ? order.shipping.deliveredAt : null,
    shipping_status: order.shipping
      ? order.shipping.shippingStatus
      : "pesanan_disiapkan",
    items: order.orderItems.map((item) => ({
      menu_id: item.menuId,
      menu_name: item.menu.name,
      menu_price: parseFloat(item.menu.price),
      menu_images: item.menu.images ? JSON.parse(item.menu.images) : [],
      quantity: parseInt(item.quantity),
      subtotal: parseFloat(item.subtotal),
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
    customer_name: order.shipping ? order.shipping.recipientName : null,
    ordered_by: {
      fullname: order.user ? order.user.fullname : null,
      email: order.user ? order.user.email : null,
    },
    phone: order.shipping ? order.shipping.recipientPhone : null,
    destination: order.shipping ? order.shipping.destination : null,
    note: order.note,
    code: order.code,
    order_date: order.eventDate,
    order_status: order.orderStatus,
    discount: parseFloat(order.discount),
    normal_price: parseFloat(order.totalPrice) + parseFloat(order.discount),
    final_price: parseFloat(order.totalPrice),
    shipping_cost: order.shipping ? parseFloat(order.shipping.shippingCost) : 0,
    delivery_method: order.shipping ? order.shipping.deliveryMethod : null,
    delivered_at: order.shipping ? order.shipping.deliveredAt : null,
    shipping_status: order.shipping
      ? order.shipping.shippingStatus
      : "pesanan_disiapkan",
    items: order.orderItems.map((item) => ({
      menu_id: item.menuId,
      menu_name: item.menu.name,
      menu_price: parseFloat(item.menu.price),
      menu_images: item.menu.images ? JSON.parse(item.menu.images) : [],
      quantity: parseInt(item.quantity),
      subtotal: parseFloat(item.subtotal),
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
    discount,
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
      !moment(setDate(existingOrder.order_date)).isSame(
        setDate(payload.order_date),
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

  const {
    totalPerItem,
    totalPrice,
    discount: calculatedDiscount,
  } = calculateOrderItems(itemsWithPrice, shippingCost, discount);

  // update stock jika order date diubah dan order date lama belum lewat atau merupakan order baru, atau jika status order diubah menjadi pesanan_diterima atau pesanan_dibatalkan
  const existingOrderDate = setDate(existingOrder.order_date);
  const newOrderDate = setDate(orderDate);

  return await prisma.$transaction(async (prisma) => {
    if (
      !moment(existingOrderDate).isSame(newOrderDate, "day") ||
      payload.order_status === "pesanan_diterima" ||
      payload.order_status === "pesanan_dibatalkan"
    ) {
      const today = getToday().start;

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
            updatedAt: setDateTime(new Date()),
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
            updatedAt: setDateTime(new Date()),
          },
        });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        eventDate: setDateTime(payload.order_date),
        note: payload.note,
        userId: payload.user_id,
        code: payload.code,
        totalPrice,
        discount: calculatedDiscount,
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

        updatedAt: setDateTime(new Date()),
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
        deliveredAt: setDateTime(payload.order_date),
        shippingCost: payload.shipping_cost,
        updatedAt: setDateTime(new Date()),
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

  const today = getToday().start;
  // jika order hari ini atau belum lewat atau merupakan order baru, kembalikan stock (increment 1)
  if (
    existingOrder.eventDate >= today ||
    existingOrder.order_status === "pesanan_diterima"
  ) {
    await prisma.stockOrder.updateMany({
      where: {
        eventDate: setDate(existingOrder.eventDate),
      },
      data: {
        currentStock: {
          increment: 1,
        },
        updatedAt: setDateTime(new Date()),
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

const exportOrders = async (filters, type) => {
  const exportType = type.toLowerCase();
  const allowedTypes = ["csv", "xlsx", "pdf"];

  if (!allowedTypes.includes(exportType)) {
    throw {
      statusCode: 400,
      message: `Tipe ekspor tidak valid. Tipe yang diperbolehkan: ${allowedTypes.join(
        ", ",
      )}`,
    };
  }

  const {
    userId,
    isAdmin,
    search,
    shipping_status,
    order_status,
    delivery_method,
    from,
    to,
  } = filters;

  const eventDateFilter = {};
  if (from) eventDateFilter.gte = setDateTime(from);
  if (to) eventDateFilter.lte = setDateTime(to);

  const orders = await prisma.order.findMany({
    orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }],
    where: {
      userId: isAdmin ? undefined : userId,
      orderStatus: order_status ?? undefined,
      eventDate: from || to ? eventDateFilter : undefined,
      shipping: {
        shippingStatus: shipping_status ?? undefined,
        deliveryMethod: delivery_method ?? undefined,
      },
      OR: search
        ? [
            { user: { fullname: { contains: search, mode: "insensitive" } } },
            { code: { contains: search, mode: "insensitive" } },
            {
              shipping: {
                recipientName: search
                  ? { contains: search, mode: "insensitive" }
                  : undefined,
                recipientPhone: search
                  ? { contains: search, mode: "insensitive" }
                  : undefined,
              },
            },
          ]
        : undefined,
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

  const formatRupiah = (value) =>
    `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

  const rows = orders.map((order, idx) => {
    const items = order.orderItems || [];
    const menuText = items
      .map(
        (item) =>
          `${item.menu.name} x${item.quantity} (${formatRupiah(item.subtotal)})`,
      )
      .join("\n");

    return {
      No: idx + 1,
      "Kode Order": order.code || "-",
      Pelanggan: order.shipping?.recipientName || "-",
      Telepon: order.shipping?.recipientPhone || "-",
      Menu: menuText || "-",
      Pengiriman: order.shipping?.deliveryMethod || "-",
      Status: order.orderStatus || "-",
      "Total Harga": formatRupiah(order.totalPrice),
      Tanggal: formatDateWIB(order.eventDate, true),
    };
  });

  // ── Total pendapatan (kecuali pesanan dibatalkan) ──
  const totalRevenue = orders.reduce((sum, o) => {
    if (o.orderStatus === "pesanan_dibatalkan") return sum;
    return sum + Number(o.totalPrice || 0);
  }, 0);

  const periodInfo =
    from || to
      ? `Periode: ${from ? formatDateResponse(from) : "-"} s/d ${to ? formatDateResponse(to) : "-"}`
      : "Periode: Semua Transaksi";

  const meta = {
    brand: "Catering Dhewi",
    title: "Laporan Transaksi",
    info: [periodInfo, "Tipe Transaksi: Order Pelanggan"],
    sheetName: "Laporan Transaksi",
    footer: {
      label: "Total Pendapatan:",
      value: formatRupiah(totalRevenue),
    },
  };

  if (exportType === "csv") return exporter.exportToCSV(rows, meta);
  if (exportType === "xlsx") return exporter.exportToXLSX(rows, meta);
  if (exportType === "pdf") return exporter.exportToPDF(rows, meta);
};

export default {
  validateOrderStock,
  checkDateOrderStock,
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  exportOrders,
};
