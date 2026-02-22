import { Router } from "express";
import controller from "./auth.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { registerSchema, loginSchema } from "./auth.schema.js";

const router = new Router();
router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.get("/me", authenticate, controller.me);

export default router;
