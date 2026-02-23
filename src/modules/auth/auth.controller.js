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
  const user = await authService.me(req.user.id);
  return sendSuccess(res, user, "Data user berhasil diambil");
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, result, "Profil berhasil diperbarui");
  } catch (err) {
    next(err);
  }
};

export default { register, login, me, updateProfile };
