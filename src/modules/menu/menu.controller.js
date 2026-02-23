import { sendSuccess } from "../../common/response.js";
import menuService from "./menu.service.js";

// ----------- / / -----------
// TODO: Category
// ----------- / / -----------
const createCategory = async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    const category = await menuService.createCategory({ name, slug });
    return sendSuccess(res, category, "Kategori berhasil dibuat", 201);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;
    const category = await menuService.updateCategory(String(id), {
      name,
      slug,
    });
    return sendSuccess(res, category, "Kategori berhasil diperbarui");
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await menuService.getAllCategories();
    return sendSuccess(res, categories, "Daftar kategori berhasil diambil");
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await menuService.deleteCategory(String(id));
    return sendSuccess(res, null, "Kategori berhasil dihapus");
  } catch (error) {
    next(error);
  }
};

// ----------- / / -----------
// TODO: Menu
// ----------- / / -----------

const createMenu = async (req, res, next) => {
  try {
    const { name, slug, is_active, category_id, price, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const menu = await menuService.createMenu({
      name,
      slug,
      is_active,
      category_id,
      imageUrl,
      price,
      description,
    });

    return sendSuccess(res, menu, "Menu berhasil dibuat", 201);
  } catch (error) {
    next(error);
  }
};

const updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, is_active, category_id, price, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const menu = await menuService.updateMenu(Number(id), {
      name,
      slug,
      is_active,
      category_id,
      imageUrl,
      price,
      description,
    });

    return sendSuccess(res, menu, "Menu berhasil diperbarui");
  } catch (error) {
    next(error);
  }
};

export default {
  createCategory,
  updateCategory,
  getAllCategories,
  deleteCategory,
  createMenu,
  updateMenu,
};
