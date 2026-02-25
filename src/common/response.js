import { Prisma } from "@prisma/client";

const toSnakeCase = (str) => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
};

const isPrismaDecimal = (val) => {
  return val instanceof Prisma.Decimal;
};

export const dataKeyToSnakeCase = (data, { decimal = "string" } = {}) => {
  if (Array.isArray(data)) {
    return data.map((item) => dataKeyToSnakeCase(item, { decimal }));
  }

  if (data instanceof Date) return data;

  if (isPrismaDecimal(data)) {
    if (decimal === "number") return data.toNumber();
    return data.toString();
  }

  if (data !== null && typeof data === "object") {
    return Object.keys(data).reduce((acc, key) => {
      acc[toSnakeCase(key)] = dataKeyToSnakeCase(data[key], { decimal });
      return acc;
    }, {});
  }

  return data;
};

// ----------- / / -----------
// TODO: Response Helpers
// ----------- / / -----------

const sendSuccess = (
  res,
  data = null,
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: dataKeyToSnakeCase(data),
  });
};

const sendError = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  errors = null,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

const sendWithPagination = (
  res,
  data,
  pagination,
  message = "Success",
  code = 200,
  isSuccess = true,
) => {
  return res.status(code).json({
    success: isSuccess,
    message,
    data: dataKeyToSnakeCase(data),
    pagination: dataKeyToSnakeCase(pagination),
  });
};

// ----------- / / -----------
// TODO: Build Pagination
// ----------- / / -----------

const buildPagination = (totalItems, currentPage = 1, pageSize = 10) => {
  const total = Number.isFinite(Number(totalItems)) ? Number(totalItems) : 0;

  let size = Number(pageSize);
  if (!Number.isFinite(size) || size <= 0) size = 10;

  let page = Number(currentPage);
  if (!Number.isFinite(page) || page <= 0) page = 1;

  const totalPages = total === 0 ? 0 : Math.ceil(total / size);

  if (totalPages > 0 && page > totalPages) page = totalPages;

  const hasNextPage = totalPages > 0 && page < totalPages;
  const hasPreviousPage = totalPages > 0 && page > 1;

  return {
    totalItems: total,
    currentPage: page,
    pageSize: size,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex: totalPages === 0 ? 0 : (page - 1) * size,
    endIndex: totalPages === 0 ? 0 : Math.min(page * size, total),
  };
};

export { sendSuccess, sendError, sendWithPagination, buildPagination };
