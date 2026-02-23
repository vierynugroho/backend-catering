import { Router } from "express";
import controller from "./menu/menu.controller.js";

const router = new Router();

// ----------- / / -----------
// TODO: Menu
// ----------- / / -----------

router.route("/menus").get(controller.getMenus);

export default router;
