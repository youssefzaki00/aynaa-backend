const Device = require('../models/Device');
const Keyword = require('../models/Keyword');
const GlobalWhitelist = require('../models/GlobalWhitelist');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Sync device and return keywords + whitelist
 * POST /api/v1/sync
 */
const syncDevice = async (req, res, next) => {
  try {
    // Fetch all enabled keywords
    const keywords = await Keyword.find({ isEnabled: true }).select('-__v -createdAt -updatedAt');

    // Fetch global whitelist
    const whitelist = await GlobalWhitelist.find().select('-__v -createdAt -updatedAt');

    sendSuccess(res, 200, 'Sync data retrieved successfully', {
      keywords: keywords.map((k) => ({
        word: k.word,
        category: k.category,
      })),
      whitelist: whitelist.map((w) => ({
        packageName: w.packageName,
        appName: w.appName,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { syncDevice };
