import userService from "./user.service.js";
import { sendSuccess, sendError } from "../../common/response.js";

const getUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await userService.getUsers(
      Number(page) || null,
      Number(limit) || null,
    );
    return sendSuccess(res, result, "Data user berhasil diambil", 200);
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
    const { fullname, email, password, phone, address, customer_type } =
      req.body;

    const result = await userService.createUser({
      fullname,
      email,
      password,
      phone,
      address,
      customer_type,
    });
    return sendSuccess(res, result, "User berhasil dibuat", 201);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullname, email, password, phone, address, customer_type } =
      req.body;

    const result = await userService.updateUser(String(id), {
      fullname,
      email,
      password,
      phone,
      address,
      customer_type,
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
