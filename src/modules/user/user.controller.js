import userService from "./user.service.js";
import {
  sendSuccess,
  sendError,
  sendWithPagination,
} from "../../common/response.js";

const getUsers = async (req, res, next) => {
  try {
    const { page, limit, from, to, search, customer_type, type } = req.query;
    const filters = {
      from,
      to,
      search,
      customer_type,
      type,
      page: Number(page) || null,
      limit: Number(limit) || null,
    };
    const result = await userService.getUsers(filters);
    return sendWithPagination(
      res,
      result.users,
      result.pagination,
      "Data user berhasil diambil",
      200,
    );
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await userService.getUserById(String(id));
    return sendSuccess(res, result, "Data user berhasil diambil", 200);
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { fullname, email, password, phone, address, customer_type, role } =
      req.body;

    const result = await userService.createUser({
      fullname,
      email,
      password,
      phone,
      address,
      customer_type,
      role,
    });
    return sendSuccess(res, result, "User berhasil dibuat", 201);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullname, email, password, phone, address, customer_type, role } =
      req.body;

    const result = await userService.updateUser(String(id), {
      fullname,
      email,
      password,
      phone,
      address,
      customer_type,
      role,
    });
    return sendSuccess(res, result, "User berhasil diperbarui", 200);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    await userService.deleteUser(String(id));
    return sendSuccess(res, null, "User berhasil dihapus", 200);
  } catch (err) {
    next(err);
  }
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
