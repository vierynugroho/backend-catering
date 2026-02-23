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
import {
  compressAndUploadToImageKit,
  handleMulterError,
  uploadMultiple,
} from "../../middlewares/upload.middleware.js";

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
  .get(controller.getMenus)
  .post(
    authenticate,
    authorizeAdmin,
    uploadMultiple,
    compressAndUploadToImageKit,
    handleMulterError,
    validate(createMenuSchema),
    controller.createMenu,
  );

router
  .route("/:id")
  .put(
    authenticate,
    authorizeAdmin,
    uploadMultiple,
    compressAndUploadToImageKit,
    handleMulterError,
    validate(updateMenuSchema),
    controller.updateMenu,
  )
  .get(controller.getMenuById)
  .delete(authenticate, authorizeAdmin, controller.deleteMenu);

export default router;
