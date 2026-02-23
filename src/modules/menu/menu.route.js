import { Router } from "express";
import controller from "./menu.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  authenticate,
  authorizeAdmin,
} from "../../middlewares/auth.middleware.js";
import {
  createCategorySchema,
  createMenuSchema,
  updateCategorySchema,
  updateMenuSchema,
} from "./menu.schema.js";
import { uploadMultiple } from "../../middlewares/upload.middleware.js";

const router = new Router();

// ----------- / / -----------
// TODO: Category
// ----------- / / -----------

router
  .route("/categories")
  .get(controller.getAllCategories)
  .post(
    authenticate,
    authorizeAdmin,
    validate(createCategorySchema),
    controller.createCategory,
  );

router
  .route("/categories/:id")
  .put(
    authenticate,
    authorizeAdmin,
    validate(updateCategorySchema),
    controller.updateCategory,
  )
  .delete(authenticate, authorizeAdmin, controller.deleteCategory);

// ----------- / / -----------
// TODO: Menu
// ----------- / / -----------

router
  .route("/")
  .post(
    authenticate,
    authorizeAdmin,
    uploadMultiple,
    validate(createMenuSchema),
    controller.createMenu,
  );

router
  .route("/:id")
  .put(
    authenticate,
    authorizeAdmin,
    uploadMultiple,
    validate(updateMenuSchema),
    controller.updateMenu,
  );

export default router;
