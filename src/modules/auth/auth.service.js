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

  const token = generateToken({ id: user.id, role: user.role });
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

export default { register, login };
