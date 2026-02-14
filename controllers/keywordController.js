const Keyword = require('../models/Keyword');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Create a new keyword
 * POST /api/v1/admin/keywords
 */
const createKeyword = async (req, res, next) => {
  try {
    const { word, category } = req.body;

    if (!word || !category) {
      return sendError(res, 400, 'Word and category are required');
    }

    // Check valid category
    const validCategories = ['PORN', 'GAMBLING', 'ATHEISM', 'VIOLENCE', 'OTHER'];
    if (!validCategories.includes(category)) {
      return sendError(res, 400, 'Invalid category');
    }

    const keyword = await Keyword.create({
      word: word.toLowerCase().trim(),
      category,
      isEnabled: true,
    });

    sendSuccess(res, 201, 'Keyword created successfully', {
      keyword: {
        id: keyword._id,
        word: keyword.word,
        category: keyword.category,
        isEnabled: keyword.isEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all keywords with optional filters
 * GET /api/v1/admin/keywords?category=PORN&isEnabled=true&page=1&limit=50
 */
const getKeywords = async (req, res, next) => {
  try {
    const { category, isEnabled, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (isEnabled !== undefined) filter.isEnabled = isEnabled === 'true';

    const keywords = await Keyword.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Keyword.countDocuments(filter);

    sendSuccess(res, 200, 'Keywords retrieved successfully', {
      keywords,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
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
    const { word, category } = req.body;

    const keyword = await Keyword.findById(id);
    if (!keyword) {
      return sendError(res, 404, 'Keyword not found');
    }

    if (word) keyword.word = word.toLowerCase().trim();
    if (category) {
      const validCategories = ['PORN', 'GAMBLING', 'ATHEISM', 'VIOLENCE', 'OTHER'];
      if (!validCategories.includes(category)) {
        return sendError(res, 400, 'Invalid category');
      }
      keyword.category = category;
    }

    await keyword.save();

    sendSuccess(res, 200, 'Keyword updated successfully', {
      keyword: {
        id: keyword._id,
        word: keyword.word,
        category: keyword.category,
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

    const keyword = await Keyword.findByIdAndDelete(id);
    if (!keyword) {
      return sendError(res, 404, 'Keyword not found');
    }

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

    const keyword = await Keyword.findById(id);
    if (!keyword) {
      return sendError(res, 404, 'Keyword not found');
    }

    keyword.isEnabled = !keyword.isEnabled;
    await keyword.save();

    sendSuccess(res, 200, 'Keyword toggled successfully', {
      keyword: {
        id: keyword._id,
        word: keyword.word,
        category: keyword.category,
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
