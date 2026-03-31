const Keyword = require('../models/Keyword');
const Category = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/response');
const { executePaginatedQuery } = require('../utils/pagination');
const { normalizeWord, validateRequiredFields } = require('../utils/validation');

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

    const filter = {};
    
    // Filter by category if provided
    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId });
      if (!category) {
        return sendError(res, 404, 'Category not found');
      }
      filter.category = category._id;
    }
    
    if (isEnabled !== undefined) filter.isEnabled = isEnabled === 'true';

    // Bind lastSync query to filter object
    if(lastSync){
      filter.createdAt = {$gt : new Date(lastSync)}
      filter.updatedAt = {$gt : new Date(lastSync)}
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

    // Transform keywords to use category.id instead of category._id
    const transformedKeywords = keywords.map(keyword => {
      const keywordObj = keyword.toJSON();
      if (keywordObj.category) {
        keywordObj.category.id = keywordObj.category._id;
        delete keywordObj.category._id;
      }
      return keywordObj;
    });

    sendSuccess(res, 200, 'Keywords retrieved successfully', {
      keywords: keywords,
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

    const keyword = await Keyword.findOne({ _id: id });
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

    const categoryData = keyword.category ? {
      id: keyword.category._id,
      name: keyword.category.name,
      displayName: keyword.category.displayName,
    } : null;

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

    const keyword = await Keyword.findOneAndDelete({ _id: id });

    // if keyword is null (mean that it is deleted before) the endpoint stills return 200 because
    // delete method is idempotent
    sendSuccess(res, 200, 'Keyword deleted successfully', {
      deletedKeyword: {
        id: keyword._id,
        word: keyword.word,
      },
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

    const keyword = await Keyword.findOne({ _id: id });
    if (!keyword) {
      return sendError(res, 404, 'Keyword not found');
    }

    keyword.isEnabled = !keyword.isEnabled;
    await keyword.save();
    await keyword.populate('category');

    const categoryData = keyword.category ? {
      id: keyword.category._id,
      name: keyword.category.name,
      displayName: keyword.category.displayName,
    } : null;

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
