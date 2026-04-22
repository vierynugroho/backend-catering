import { buildPagination } from "../../common/response.js";
import prisma from "../../config/db/prisma.js";
import { deleteFromImageKit } from "../../lib/imageKit.js";

// ----------- / / -----------
// TODO: Category
// ----------- / / -----------

const createCategory = async ({ name, slug }) => {
  const existing = await prisma.category.findUnique({
    where: {
      slug,
    },
  });

  if (existing)
    throw { statusCode: 409, message: "Slug kategori sudah digunakan" };

  return await prisma.category.create({
    data: {
      name,
      slug,
    },
  });
};

const updateCategory = async (id, { name, slug }) => {
  const existing = await prisma.category.findUnique({
    where: {
      slug,
    },
  });

  if (existing && existing.id !== id)
    throw { statusCode: 409, message: "Slug kategori sudah digunakan" };

  return await prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
    },
  });
};

const getAllCategories = async (filters) => {
  const { from, to, name, page, limit } = filters;
  const parsedPage = parseInt(page) || 1;
  const parsedLimit = parseInt(limit) || 10;
  const categories = await prisma.category.findMany({
    where: {
      createdAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
      name: name ? { contains: name, mode: "insensitive" } : undefined,
    },
    orderBy: {
      name: "asc",
    },
    take: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  });

  const totalCount = await prisma.category.count({
    where: {
      createdAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
      name: name ? { contains: name, mode: "insensitive" } : undefined,
    },
  });

  return {
    categories,
    pagination: buildPagination(totalCount, parsedPage, parsedLimit),
  };
};

const deleteCategory = async (id) => {
  await prisma.$transaction(async (prisma) => {
    const usedOnMenu = await prisma.menu.findMany({
      where: {
        categoryId: id,
      },
    });

    if (usedOnMenu.length > 0) {
      const updateMenuToUncategorized = usedOnMenu.map(async (menu) => {
        return await prisma.menu.update({
          where: { id: menu.id },
          data: { categoryId: null },
        });
      });

      await Promise.all(updateMenuToUncategorized);
    }

    return await prisma.category.delete({
      where: { id },
    });
  });
};

// ----------- / / -----------
// TODO: Menu
// ----------- / / -----------

const createMenu = async ({
  name,
  slug,
  is_active,
  category_id,
  images,
  price,
  description,
}) => {
  const existing = await prisma.menu.findUnique({
    where: {
      slug,
    },
  });

  if (existing) throw { statusCode: 409, message: "Slug menu sudah digunakan" };

  const category = await prisma.category.findUnique({
    where: { id: category_id },
  });

  if (category_id && !category)
    throw { statusCode: 400, message: "Kategori tidak ditemukan" };

  return await prisma.menu.create({
    data: {
      name,
      slug,
      isActive: is_active,
      images: images.length > 0 ? JSON.stringify(images) : null,
      categoryId: category_id || null,
      price,
      description,
    },
    include: {
      category: true,
    },
  });
};

const updateMenu = async (
  id,
  { name, slug, is_active, category_id, images, price, description },
) => {
  const existing = await prisma.menu.findUnique({
    where: {
      slug,
    },
  });

  if (existing && existing.id !== id)
    throw { statusCode: 409, message: "Slug menu sudah digunakan" };

  // Jika update gambar, pastikan untuk hapus gambar lama dari ImageKit
  if (images && images.length > 0) {
    const currentMenu = await prisma.menu.findUnique({
      where: { id },
    });

    if (currentMenu && currentMenu.images) {
      const currentImages = JSON.parse(currentMenu.images);
      const deletePromises = currentImages.map(async (img) => {
        console.log("deleting image with fileId:", img.fileId);
        await deleteFromImageKit(img.fileId);
      });
      await Promise.allSettled(deletePromises);
    }
  }

  return await prisma.menu.update({
    where: { id },
    data: {
      name,
      slug,
      isActive: is_active,
      images: images.length > 0 ? JSON.stringify(images) : undefined,
      categoryId: category_id || null,
      price,
      description,
    },
  });
};

const getMenus = async (filters) => {
  const { isAdmin, page, limit, from, to, name } = filters;
  const parsedPage = parseInt(page) || 1;
  const parsedLimit = parseInt(limit) || 10;
  const menuWithCategory = await prisma.menu.findMany({
    orderBy: [{ price: "asc" }, { name: "asc" }],
    where: {
      isActive: isAdmin ? undefined : true,
      categoryId: filters.category_id || undefined,
      createdAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
      name: name ? { contains: name, mode: "insensitive" } : undefined,
    },
    include: {
      category: true,
    },
    take: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  });

  const menuCount = await prisma.menu.count({
    where: {
      isActive: isAdmin ? undefined : true,
      createdAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
      name: name ? { contains: name, mode: "insensitive" } : undefined,
    },
  });

  const mappedData = menuWithCategory.map((menu) => ({
    id: menu.id,
    name: menu.name,
    slug: menu.slug,
    is_active: menu.isActive,
    images: menu.images ? JSON.parse(menu.images) : [],
    price: Number(menu.price) || 0,
    description: menu.description,
    category: menu.category
      ? {
          id: menu.category.id,
          name: menu.category.name,
          slug: menu.category.slug,
        }
      : null,
  }));

  return {
    menus: mappedData,
    pagination: buildPagination(menuCount, parsedPage, parsedLimit),
  };
};

const deleteMenu = async (id) => {
  const menu = await prisma.menu.findUnique({
    where: { id },
  });

  if (!menu) throw { statusCode: 404, message: "Menu tidak ditemukan" };

  const updateToNonActive = await prisma.menu.update({
    where: { id },
    data: {
      isActive: false,
    },
  });

  return updateToNonActive;
};

const getMenuById = async (id, isAdmin = false) => {
  const menu = await prisma.menu.findUnique({
    where: { id, isActive: isAdmin ? undefined : true },
    include: {
      category: true,
    },
  });

  if (!menu) throw { statusCode: 404, message: "Menu tidak ditemukan" };

  return {
    id: menu.id,
    name: menu.name,
    slug: menu.slug,
    is_active: menu.isActive,
    images: menu.images ? JSON.parse(menu.images) : [],
    price: Number(menu.price) || 0,
    description: menu.description,
    category: menu.category
      ? {
          id: menu.category.id,
          name: menu.category.name,
          slug: menu.category.slug,
        }
      : null,
  };
};

export default {
  createMenu,
  updateMenu,
  getMenus,
  createCategory,
  updateCategory,
  getAllCategories,
  deleteCategory,
  deleteMenu,
  getMenuById,
};
