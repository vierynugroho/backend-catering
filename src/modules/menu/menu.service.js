import prisma from "../../config/db/prisma";

const createCategory = async ({ name, slug }) => {
  const existing = await prisma.menu.findUnique({
    where: {
      slug,
    },
  });

  if (existing)
    throw { statusCode: 409, message: "Slug kategori sudah digunakan" };

  return await prisma.menu.create({
    data: {
      name,
      slug,
    },
  });
};

const updateCategory = async (id, { name, slug }) => {
  const existing = await prisma.menu.findUnique({
    where: {
      slug,
    },
  });

  if (existing && existing.id !== id)
    throw { statusCode: 409, message: "Slug kategori sudah digunakan" };

  return await prisma.menu.update({
    where: { id },
    data: {
      name,
      slug,
    },
  });
};

const createMenu = async ({
  name,
  slug,
  is_active,
  category_id,
  imageUrl,
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
      is_active,
      imageUrl: imageUrl || null,
      category_id: category_id || null,
      price,
      description,
    },
  });
};

const updateMenu = async (
  id,
  { name, slug, is_active, category_id, imageUrl, price, description },
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
      is_active,
      imageUrl: imageUrl || null,
      category_id: category_id || null,
      price,
      description,
    },
  });
};

export default { createMenu, updateMenu, createCategory, updateCategory };
