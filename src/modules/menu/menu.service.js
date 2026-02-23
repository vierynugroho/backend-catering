import prisma from "../../config/db/prisma.js";

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

const getAllCategories = async () => {
  return await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
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
  imageUrl,
  imageId,
  price,
  description,
}) => {
  const existing = await prisma.menu.findUnique({
    where: {
      slug,
    },
  });

  if (existing) throw { statusCode: 409, message: "Slug menu sudah digunakan" };

  return await prisma.menu.create({
    data: {
      name,
      slug,
      isActive: is_active,
      imageUrl: imageUrl || null,
      imageId: imageId || null,
      categoryId: category_id || null,
      price,
      description,
    },
  });
};

const updateMenu = async (
  id,
  { name, slug, is_active, category_id, imageUrl, imageId, price, description },
) => {
  const existing = await prisma.menu.findUnique({
    where: {
      slug,
    },
  });

  if (existing && existing.id !== id)
    throw { statusCode: 409, message: "Slug menu sudah digunakan" };

  return await prisma.menu.update({
    where: { id },
    data: {
      name,
      slug,
      isActive: is_active,
      imageUrl: imageUrl || null,
      imageId: imageId || null,
      categoryId: category_id || null,
      price,
      description,
    },
  });
};

export default {
  createMenu,
  updateMenu,
  createCategory,
  updateCategory,
  getAllCategories,
  deleteCategory,
};
