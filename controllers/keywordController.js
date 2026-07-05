const Keyword = require('../models/Keyword');
const Category = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/response');
const { executePaginatedQuery } = require('../utils/pagination');
const { normalizeWord, validateRequiredFields } = require('../utils/validation');
const { invalidateCache } = require('../utils/cacheInvalidate');
const { CACHE_KEYS } = require('../constants/cacheKeys');

/**
 * Create a new keyword
 * POST /api/v1/admin/keywords
 */
const createKeyword = async (req, res, next) => {
  try {
    const { word, categoryId } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, ['word', 'categoryId']);
    if (!validation.valid) {
      return sendError(res, 400, `Missing required fields: ${validation.missing.join(', ')}`);
    }

    // Verify category exists
    const category = await Category.findOne({ _id: categoryId });
    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    if (!category.isActive) {
      return sendError(res, 400, 'Cannot create keyword with inactive category');
    }

    const keyword = await Keyword.create({
      word: normalizeWord(word),
      category: category._id,
      isEnabled: true,
    });

    // Populate category for response
    await keyword.populate('category');

    await invalidateCache(CACHE_KEYS.KEYWORDS);

    sendSuccess(res, 201, 'Keyword created successfully', {
      keyword: {
        id: keyword._id,
        word: keyword.word,
        category: {
          id: category._id,
          name: category.name,
          displayName: category.displayName,
        },
        isEnabled: keyword.isEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all keywords with optional filters
 * GET /api/v1/keywords?categoryId=xxx&isEnabled=true&page=1&limit=50&lastSync=<Date>
 */
const getKeywords = async (req, res, next) => {
  try {
    const { categoryId, isEnabled, lastSync } = req.query;

    const filter = { deletedAt: null };

    if (categoryId) {
      filter.category = categoryId;
    }

    if (isEnabled !== undefined) filter.isEnabled = isEnabled === 'true';

    if (lastSync) {
      const since = new Date(lastSync);
      filter.$or = [
        { createdAt: { $gt: since } },
        { updatedAt: { $gt: since } },
      ];
    }

    const { items: keywords, pagination } = await executePaginatedQuery({
      model: Keyword,
      filter,
      query: req.query,
      populate: {
        path: 'category',
        select: '_id name displayName',
      },
    });

    const transformedKeywords = keywords.map((keyword) => {
      const keywordObj = keyword.toJSON();
      if (keywordObj.category) {
        keywordObj.category.id = keywordObj.category._id;
        delete keywordObj.category._id;
      }
      return keywordObj;
    });

    let deletedKeywordIds = [];
    if (lastSync) {
      const since = new Date(lastSync);
      const tombstones = await Keyword.find({ deletedAt: { $gt: since } }).select('_id');
      deletedKeywordIds = tombstones.map((d) => d._id);
    }

    sendSuccess(res, 200, 'Keywords retrieved successfully', {
      keywords: transformedKeywords,
      deletedKeywordIds,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a keyword
 * PATCH /api/v1/admin/keywords/:id
 */
const updateKeyword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { word, categoryId } = req.body;

    const keyword = await Keyword.findOne({ _id: id, deletedAt: null });
    if (!keyword) {
      return sendError(res, 404, 'Keyword not found');
    }

    if (word) keyword.word = normalizeWord(word);

    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId });
      if (!category) {
        return sendError(res, 404, 'Category not found');
      }
      if (!category.isActive) {
        return sendError(res, 400, 'Cannot assign keyword to inactive category');
      }
      keyword.category = category._id;
    }

    await keyword.save();
    await keyword.populate('category');

    await invalidateCache(CACHE_KEYS.KEYWORDS);

    const categoryData = keyword.category
      ? {
          id: keyword.category._id,
          name: keyword.category.name,
          displayName: keyword.category.displayName,
        }
      : null;

    sendSuccess(res, 200, 'Keyword updated successfully', {
      keyword: {
        id: keyword._id,
        word: keyword.word,
        category: categoryData,
        isEnabled: keyword.isEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a keyword
 * DELETE /api/v1/admin/keywords/:id
 */
const deleteKeyword = async (req, res, next) => {
  try {
    const { id } = req.params;

    const keyword = await Keyword.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    await invalidateCache(CACHE_KEYS.KEYWORDS);

    // delete method is idempotent — return 200 even if already deleted
    sendSuccess(res, 200, 'Keyword deleted successfully', {
      deletedKeyword: keyword
        ? {
            id: keyword._id,
            word: keyword.word,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle keyword enabled/disabled status
 * PATCH /api/v1/admin/keywords/:id/toggle
 */
const toggleKeyword = async (req, res, next) => {
  try {
    const { id } = req.params;

    const keyword = await Keyword.findOne({ _id: id, deletedAt: null });
    if (!keyword) {
      return sendError(res, 404, 'Keyword not found');
    }

    keyword.isEnabled = !keyword.isEnabled;
    await keyword.save();
    await keyword.populate('category');

    await invalidateCache(CACHE_KEYS.KEYWORDS);

    const categoryData = keyword.category
      ? {
          id: keyword.category._id,
          name: keyword.category.name,
          displayName: keyword.category.displayName,
        }
      : null;

    sendSuccess(res, 200, 'Keyword toggled successfully', {
      keyword: {
        id: keyword._id,
        word: keyword.word,
        category: categoryData,
        isEnabled: keyword.isEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createKeyword,
  getKeywords,
  updateKeyword,
  deleteKeyword,
  toggleKeyword,
};
