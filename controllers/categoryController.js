const Category = require('../models/Category');
const Keyword = require('../models/Keyword');
const { sendSuccess, sendError } = require('../utils/response');
const { executePaginatedQuery } = require('../utils/pagination');
const { validateRequiredFields } = require('../utils/validation');
const { invalidateListCache } = require('../utils/cacheInvalidate');

/**
 * Create a new category
 * POST /api/v1/admin/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, displayName, description } = req.body;

    const validation = validateRequiredFields(req.body, ['name', 'displayName']);
    if (!validation.valid) {
      return sendError(res, 400, `Missing required fields: ${validation.missing.join(', ')}`);
    }

    const category = await Category.create({
      name: name.toUpperCase().trim(),
      displayName: displayName.trim(),
      description: description ? description.trim() : null,
      isActive: true,
    });

    await invalidateListCache('KEYWORDS', 'SITES');

    sendSuccess(res, 201, 'Category created successfully', {
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Category name already exists');
    }
    next(error);
  }
};

/**
 * Get all categories with optional filters
 * GET /api/v1/admin/categories?isActive=true&page=1&limit=50
 */
const getCategories = async (req, res, next) => {
  try {
    const { isActive } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const { items: categories, pagination } = await executePaginatedQuery({
      model: Category,
      filter,
      query: req.query,
      searchFields: ['name', 'displayName', 'description'],
    });

    sendSuccess(res, 200, 'Categories retrieved successfully', {
      categories,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single category by ID
 * GET /api/v1/admin/categories/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ _id: id });
    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    // Get keyword count for this category
    const keywordCount = await Keyword.countDocuments({ category: category._id, deletedAt: null });

    sendSuccess(res, 200, 'Category retrieved successfully', {
      category: {
        ...category.toJSON(),
        keywordCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category
 * PATCH /api/v1/admin/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, displayName, description } = req.body;

    const category = await Category.findOne({ _id: id });
    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    if (name) category.name = name.toUpperCase().trim();
    if (displayName) category.displayName = displayName.trim();
    if (description !== undefined) category.description = description ? description.trim() : null;

    await category.save();

    await invalidateListCache('KEYWORDS', 'SITES');

    sendSuccess(res, 200, 'Category updated successfully', {
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Category name already exists');
    }
    next(error);
  }
};

/**
 * Delete a category
 * DELETE /api/v1/admin/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ _id: id });
    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    // Check if any keywords are using this category
    const keywordCount = await Keyword.countDocuments({ category: category._id, deletedAt: null });
    if (keywordCount > 0) {
      return sendError(
        res, 
        400, 
        `Cannot delete category. ${keywordCount} keyword(s) are using this category. Please reassign or delete those keywords first.`
      );
    }

    await Category.findOneAndDelete({ _id: id });

    await invalidateListCache('KEYWORDS', 'SITES');

    sendSuccess(res, 200, 'Category deleted successfully', {
      deletedCategory: {
        id: category._id,
        name: category.name,
        displayName: category.displayName,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle category active/inactive status
 * PATCH /api/v1/admin/categories/:id/toggle
 */
const toggleCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ _id: id });
    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    category.isActive = !category.isActive;
    await category.save();

    await invalidateListCache('KEYWORDS', 'SITES');

    sendSuccess(res, 200, 'Category toggled successfully', {
      category,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategory,
};
