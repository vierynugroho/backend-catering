import authService from "./auth.service.js";
import { sendSuccess, sendError } from "../../common/response.js";

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, "Registrasi berhasil", 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, "Login berhasil");
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  return sendSuccess(res, req.user, "Data user berhasil diambil");
};

export default { register, login, me };
