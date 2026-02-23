import bcryptjs from "bcryptjs";
import { generateToken } from "../../utils/jwt.js";
import prisma from "../../config/db/prisma.js";

const register = async ({ fullname, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw { statusCode: 409, message: "Email sudah terdaftar" };

  const hashedPassword = await bcryptjs.hash(password, 12);

  const user = await prisma.user.create({
    data: { fullname, email, password: hashedPassword, role: "customer" },
    select: {
      id: true,
      fullname: true,
      email: true,
      role: true,
      customerType: true,
    },
  });

  const token = generateToken({ id: user.id, role: user.role });
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { statusCode: 401, message: "Email atau password salah" };

  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) throw { statusCode: 401, message: "Email atau password salah" };

  const userIsActive = await prisma.user.findFirst({
    where: { email, isActive: true },
  });
  if (!userIsActive)
    throw {
      statusCode: 403,
      message:
        "Akun Anda tidak aktif, Hubungi admin untuk mengaktifkan akun Anda",
    };

  const token = generateToken({ id: user.id, role: user.role });
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

const me = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullname: true,
      email: true,
      role: true,
      customerType: true,
    },
  });
  if (!user) throw { statusCode: 404, message: "User tidak ditemukan" };
  return user;
};

const updateProfile = async (
  userId,
  { fullname, email, password, confirm_password, phone, address },
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { statusCode: 404, message: "User tidak ditemukan" };

  const data = {};
  if (fullname) data.fullname = fullname;
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId)
      throw { statusCode: 409, message: "Email sudah terdaftar" };
    data.email = email;
  }
  if (password) {
    if (password !== confirm_password)
      throw {
        statusCode: 400,
        message: "Password dan konfirmasi password tidak cocok",
      };

    const hashedPassword = await bcryptjs.hash(password, 12);
    data.password = hashedPassword;
  }
  if (phone) {
    data.phone = phone;
  }
  if (address) {
    data.address = address;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      fullname: true,
      email: true,
      role: true,
      customerType: true,
    },
  });

  return updatedUser;
};

export default { register, login, me, updateProfile };
