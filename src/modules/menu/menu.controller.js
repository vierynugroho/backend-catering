import { sendSuccess, sendWithPagination } from "../../common/response.js";
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
    const { from, to, name, page, limit } = req.query;
    const filters = {
      from,
      to,
      name,
      page: Number(page) || null,
      limit: Number(limit) || null,
    };
    const { categories, pagination } =
      await menuService.getAllCategories(filters);
    return sendWithPagination(
      res,
      categories,
      pagination,
      "Daftar kategori berhasil diambil",
    );
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

const getMenus = async (req, res, next) => {
  try {
    const { page, limit, name, from, to, category_id } = req.query;
    const filters = {
      isAdmin: req.isAdmin ? true : false,
      page: Number(page) || null,
      limit: Number(limit) || null,
      name,
      from,
      to,
      category_id,
    };
    const { menus, pagination } = await menuService.getMenus(filters);
    return sendWithPagination(
      res,
      menus,
      pagination,
      "Menu berhasil diambil",
      200,
      true,
    );
  } catch (error) {
    next(error);
  }
};

const createMenu = async (req, res, next) => {
  try {
    const { name, slug, is_active, category_id, price, description } = req.body;

    const images = req.uploadedImages || [];

    const menu = await menuService.createMenu({
      name,
      slug,
      is_active,
      category_id,
      images,
      price,
      description,
    });

    const mappedResponse = {
      id: menu.id,
      name: menu.name,
      slug: menu.slug,
      is_active: menu.isActive,
      images: menu.images ? JSON.parse(menu.images) : [],
      price: Number(menu.price) || 0,
      description: menu.description,
      category: menu.category
        ? {
            id: menu.category.id,
            name: menu.category.name,
            slug: menu.category.slug,
          }
        : null,
    };

    return sendSuccess(res, mappedResponse, "Menu berhasil dibuat", 201);
  } catch (error) {
    next(error);
  }
};

const updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, is_active, category_id, price, description } = req.body;
    const images = req.uploadedImages || [];

    const menu = await menuService.updateMenu(String(id), {
      name,
      slug,
      is_active,
      category_id,
      images,
      price,
      description,
    });

    const mappedResponse = {
      id: menu.id,
      name: menu.name,
      slug: menu.slug,
      is_active: menu.isActive,
      images: menu.images ? JSON.parse(menu.images) : [],
      price: Number(menu.price) || 0,
      description: menu.description,
      category: menu.category
        ? {
            id: menu.category.id,
            name: menu.category.name,
            slug: menu.category.slug,
          }
        : null,
    };

    return sendSuccess(res, mappedResponse, "Menu berhasil diperbarui");
  } catch (error) {
    next(error);
  }
};

const deleteMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    await menuService.deleteMenu(String(id));
    return sendSuccess(res, null, "Menu berhasil dihapus");
  } catch (error) {
    next(error);
  }
};

const getMenuById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const menu = await menuService.getMenuById(
      String(id),
      req.isAdmin ? true : false,
    );

    return sendSuccess(res, menu, "Menu berhasil diambil");
  } catch (error) {
    next(error);
  }
};

export default {
  createCategory,
  updateCategory,
  getAllCategories,
  deleteCategory,
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenuById,
};
