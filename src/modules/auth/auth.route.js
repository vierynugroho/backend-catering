import { Router } from "express";
import controller from "./auth.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "./auth.schema.js";

const router = new Router();
router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router
  .route("/me")
  .get(authenticate, controller.me)
  .put(authenticate, validate(updateProfileSchema), controller.updateProfile);
export default router;
