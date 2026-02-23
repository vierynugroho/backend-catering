import prisma from "../../config/db/prisma.js";
import { buildPagination } from "../../common/response.js";
import { formatPhoneNumber } from "../../utils/helpers.js";
import bcryptjs from "bcryptjs";

const getUsers = async (page, limit) => {
  const users = await prisma.user.findMany({
    take: limit ?? undefined,
    skip: page && limit ? (page - 1) * limit : undefined,
  });

  const pagination = buildPagination(users.length, page, limit);

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
    throw new Error("User tidak ditemukan");
  }

  return user;
};

const createUser = async (data) => {
  const { fullname, email, password, phone, address, customer_type } = data;

  const newUser = await prisma.user.create({
    data: {
      fullname,
      email,
      password: await bcryptjs.hash(password, 12),
      phone: formatPhoneNumber(phone),
      address,
      customerType: customer_type,
    },
  });

  return newUser;
};

const updateUser = async (id, data) => {
  const { fullname, email, password, phone, address, customer_type } = data;
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      fullname,
      email,
      password: password ? await bcryptjs.hash(password, 12) : undefined,
      phone: phone ? formatPhoneNumber(phone) : undefined,
      address,
      customerType: customer_type,
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
