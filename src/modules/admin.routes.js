import { Router } from "express";
import menuController from "./menu/menu.controller.js";
import userController from "./user/user.controller.js";

const router = new Router();

// ----------- / / -----------
// TODO: Menu
// ----------- / / -----------
router.route("/menus").get(menuController.getMenus);
router.route("/menus/:id").get(menuController.getMenuById);


// ----------- / / -----------
// TODO: Users
// ----------- / / -----------
router.route("/users").get(userController.getUsers).post(userController.createUser);
router.route("/users/:id")
  .get(userController.getUserById)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
