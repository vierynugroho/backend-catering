import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

// const globalForPrisma = globalThis;

// const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// if (process.env.NODE_ENV !== "production") {
//   globalForPrisma.prisma = prisma;
// }

const prisma = prismaClientSingleton();

export default prisma;
