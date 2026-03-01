import prisma from "../../config/db/prisma.js";

const buildRangeFilters = (filters) => {
  const where = {};
  if (filters?.from) {
    where.createdAt = { gte: filters.from };
  }
  if (filters?.to) {
    where.createdAt = { ...where.createdAt, lte: filters.to };
  }
  return where;
};

const buildEventDateFilters = (filters) => {
  const where = {};
  if (filters?.from) {
    where.eventDate = { gte: filters.from };
  }
  if (filters?.to) {
    where.eventDate = { ...where.eventDate, lte: filters.to };
  }
  return where;
};

const buildDeliveryDateFilters = (filters) => {
  const where = {};
  if (filters?.from) {
    where.deliveredAt = { gte: filters.from };
  }
  if (filters?.to) {
    where.deliveredAt = { ...where.deliveredAt, lte: filters.to };
  }
  return where;
};

// ----------- / / -----------
// TODO: order reports
// ----------- / / -----------
const orderReport = async (filters, userId = null) => {
  const where = buildRangeFilters(filters);

  if (userId) {
    where.userId = userId;
  }

  const totalOrders = await prisma.order.count({ where });
  const totalRevenue = await prisma.order.aggregate({
    where,
    _sum: { totalPrice: true },
  });

  const completedOrders = await prisma.order.count({
    where: { ...where, orderStatus: "pesanan_selesai" },
  });
  const cancelledOrders = await prisma.order.count({
    where: { ...where, orderStatus: "pesanan_dibatalkan" },
  });
  const inProcessOrders = await prisma.order.count({
    where: { ...where, orderStatus: "pesanan_diproses" },
  });
  const mustBeProcessedOrders = await prisma.order.count({
    where: { ...where, orderStatus: "pesanan_diterima" },
  });

  return {
    totalOrders,
    totalRevenue: totalRevenue._sum.totalPrice || 0,
    completedOrders,
    cancelledOrders,
    inProcessOrders,
    mustBeProcessedOrders,
  };
};

// ----------- / / -----------
// TODO: stock reports
// ----------- / / -----------
const stockReport = async (filters) => {
  const where = buildEventDateFilters(filters);

  const outOfStockRows = await prisma.stockOrder.findMany({
    where: {
      ...where,
      currentStock: {
        gte: prisma.stockOrder.fields.maxStock,
      },
    },
    select: {
      eventDate: true,
    },
    orderBy: [{ eventDate: "asc" }],
  });

  const inStockRows = await prisma.stockOrder.findMany({
    where: {
      ...where,
      currentStock: {
        lt: prisma.stockOrder.fields.maxStock,
      },
    },
    select: {
      eventDate: true,
    },
    orderBy: [{ eventDate: "asc" }],
  });

  return {
    outOfStock: outOfStockRows.map((r) => r.eventDate),
    inStock: inStockRows.map((r) => r.eventDate),
  };
};

// ----------- / / -----------
// TODO: shipping reports
// ----------- / / -----------
const shippingReport = async (filters, userId = null) => {
  const where = buildDeliveryDateFilters(filters);

  const baseWhere = {
    ...(userId ? { userId } : {}),
    shipping: {
      isNot: null,
      ...where,
    },
  };

  const retrievedDeliveries = await prisma.order.count({
    where: {
      ...baseWhere,
      shipping: {
        is: {
          shippingStatus: "pesanan_disiapkan",
          deliveredAt: { lte: new Date() },
        },
      },
    },
  });

  const completedDeliveries = await prisma.order.count({
    where: {
      ...baseWhere,
      shipping: {
        is: {
          shippingStatus: "pesanan_selesai",
          deliveredAt: { lte: new Date() },
        },
      },
    },
  });

  const canceledDeliveries = await prisma.order.count({
    where: {
      ...baseWhere,
      shipping: {
        is: {
          shippingStatus: "pesanan_dibatalkan",
          deliveredAt: { gt: new Date() },
        },
      },
    },
  });

  const processedDeliveries = await prisma.order.count({
    where: {
      ...baseWhere,
      shipping: {
        is: {
          shippingStatus: "pesanan_dalam_proses_pengiriman",
        },
      },
    },
  });

  return {
    retrievedDeliveries,
    completedDeliveries,
    canceledDeliveries,
    processedDeliveries,
  };
};
// ----------- / / -----------
// TODO: menu reports
// ----------- / / -----------
const menuReport = async (filters, userId = null) => {
  const orderWhere = buildRangeFilters(filters);

  const orderFilter = {
    ...orderWhere,
    ...(userId ? { userId } : {}),
  };

  const attachMenuData = async (grouped) => {
    const menuIds = grouped.map((g) => g.menuId).filter(Boolean);

    const menus = await prisma.menu.findMany({
      where: { id: { in: menuIds } },
      include: {
        category: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
    });

    const menuById = new Map(menus.map((m) => [m.id, m]));

    return grouped.map((g) => {
      const menu = menuById.get(g.menuId) || null;
      return {
        menu_id: g.menuId,
        name: menu?.name ?? null,
        images: menu?.images ? JSON.parse(menu.images) : null,
        category: menu?.category ?? null,
        total_order: g._sum?.quantity ?? 0,
      };
    });
  };

  const topSellingRaw = await prisma.orderItem.groupBy({
    by: ["menuId"],
    where: {
      order: orderFilter,
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const leastSellingRaw = await prisma.orderItem.groupBy({
    by: ["menuId"],
    where: {
      order: orderFilter,
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "asc" } },
    take: 5,
  });

  const rows = await prisma.orderItem.findMany({
    where: {
      order: orderFilter,
    },
    select: {
      menuId: true,
      quantity: true,
      order: { select: { userId: true } },
    },
  });

  const map = new Map();

  for (const r of rows) {
    const uid = r.order.userId;
    const key = `${uid}:${r.menuId}`;
    const prev = map.get(key);

    if (prev) prev.quantity += r.quantity;
    else map.set(key, { userId: uid, menuId: r.menuId, quantity: r.quantity });
  }

  const topOrderedMenuByCustomerRaw = Array.from(map.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map((x) => ({
      menuId: x.menuId,
      userId: x.userId,
      _sum: { quantity: x.quantity },
    }));

  const [topSelling, leastSelling] = await Promise.all([
    attachMenuData(topSellingRaw),
    attachMenuData(leastSellingRaw),
  ]);

  const menuIdsCustomer = topOrderedMenuByCustomerRaw
    .map((x) => x.menuId)
    .filter(Boolean);

  const menusCustomer = await prisma.menu.findMany({
    where: { id: { in: menuIdsCustomer } },
    include: {
      category: {
        select: {
          slug: true,
          name: true,
        },
      },
    },
  });

  const menuByIdCustomer = new Map(menusCustomer.map((m) => [m.id, m]));

  const topOrderedMenuByCustomer = topOrderedMenuByCustomerRaw.map((x) => {
    const menu = menuByIdCustomer.get(x.menuId) || null;
    return {
      user_id: x.userId,
      menu_id: x.menuId,
      name: menu?.name ?? null,
      images: menu?.images ? JSON.parse(menu.images) : null,
      category: menu?.category ?? null,
      total_order: x._sum?.quantity ?? 0,
    };
  });

  return {
    topSelling,
    leastSelling,
    topOrderedMenuByCustomer,
  };
};

// ----------- / / -----------
// TODO: customer reports
// ----------- / / -----------
const customerReport = async (filters) => {
  const where = buildRangeFilters(filters);

  const attachUserData = async (grouped) => {
    const userIds = grouped.map((g) => g.userId).filter(Boolean);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        fullname: true,
        email: true,
        customerType: true,
      },
    });

    const userById = new Map(users.map((u) => [u.id, u]));

    return grouped.map((g) => {
      const user = userById.get(g.userId) || null;
      return {
        user_id: g.userId,
        fullname: user?.fullname ?? null,
        email: user?.email ?? null,
        customer_type: user?.customerType ?? null,
        total_spent: Number(g._sum?.totalPrice ?? 0),
      };
    });
  };

  const topCustomersRaw = await prisma.order.groupBy({
    by: ["userId"],
    where,
    _sum: { totalPrice: true },
    orderBy: { _sum: { totalPrice: "desc" } },
    take: 5,
  });

  const leastCustomersRaw = await prisma.order.groupBy({
    by: ["userId"],
    where,
    _sum: { totalPrice: true },
    orderBy: { _sum: { totalPrice: "asc" } },
    take: 5,
  });

  const [topCustomers, leastCustomers] = await Promise.all([
    attachUserData(topCustomersRaw),
    attachUserData(leastCustomersRaw),
  ]);

  return {
    topCustomers,
    leastCustomers,
  };
};

export { orderReport, stockReport, shippingReport, menuReport, customerReport };
