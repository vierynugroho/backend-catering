const sendSuccess = (
  res,
  data = null,
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
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
  code = 200,
  isSuccess = true,
  res,
  data,
  pagination,
  message = "Success",
) => {
  return res.status(code).json({
    success: isSuccess,
    message,
    data,
    pagination,
  });
};

export { sendSuccess, sendError, sendWithPagination };
