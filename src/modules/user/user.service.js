import prisma from "../../config/db/prisma.js";
import { buildPagination } from "../../common/response.js";
import { formatPhoneNumber } from "../../utils/helpers.js";
import bcryptjs from "bcryptjs";

const getUsers = async (filters) => {
  const { page, limit, from, to, search } = filters;
  const where = {
    ...(search && {
      OR: [
        { fullname: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: formatPhoneNumber(search) } },
      ],
    }),
    createdAt: {
      gte: from ? new Date(from) : undefined,
      lte: to ? new Date(to) : undefined,
    },
  };

  const users = await prisma.user.findMany({
    take: limit ?? undefined,
    skip: page && limit ? (page - 1) * limit : undefined,
    where,
  });

  const usersCount = await prisma.user.count({
    where,
  });

  const pagination = buildPagination(usersCount, page, limit);

  for (const user of users) {
    user.password = undefined;
  }

  return {
    users,
    pagination,
  };
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw { statusCode: 400, message: "User tidak ditemukan" };
  }

  user.password = undefined;
  return user;
};

const createUser = async (data) => {
  const { fullname, email, password, phone, address, customer_type, role } =
    data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw {
      statusCode: 400,
      message: "Email sudah terdaftar, silakan gunakan email lain",
    };
  }

  const newUser = await prisma.user.create({
    data: {
      fullname,
      email,
      password: await bcryptjs.hash(password, 12),
      phone: formatPhoneNumber(phone),
      address,
      role: role || "customer",
      customerType: customer_type,
    },
  });

  return newUser;
};

const updateUser = async (id, data) => {
  const { fullname, email, password, phone, address, customer_type, role } =
    data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    throw {
      statusCode: 404,
      message: "User tidak ditemukan",
    };
  }

  if (existingUser && existingUser.id !== id) {
    throw {
      statusCode: 400,
      message: "Email sudah terdaftar, silakan gunakan email lain",
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      fullname,
      email,
      password: password ? await bcryptjs.hash(password, 12) : undefined,
      phone: phone ? formatPhoneNumber(phone) : undefined,
      address,
      customerType: customer_type,
      role,
    },
  });

  return updatedUser;
};

const deleteUser = async (id) => {
  await prisma.user.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};

export default { getUsers, getUserById, createUser, updateUser, deleteUser };
