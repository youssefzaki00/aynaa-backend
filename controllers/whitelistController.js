const GlobalWhitelist = require('../models/GlobalWhitelist');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Add an app to the global whitelist
 * POST /api/v1/admin/whitelist
 */
const addToWhitelist = async (req, res, next) => {
  try {
    const { packageName, appName } = req.body;

    if (!packageName || !appName) {
      return sendError(res, 400, 'Package name and App name are required');
    }

    const whitelistApp = await GlobalWhitelist.create({
      packageName: packageName.trim(),
      appName: appName.trim(),
    });

    sendSuccess(res, 201, 'App added to whitelist successfully', {
      app: {
        id: whitelistApp._id,
        packageName: whitelistApp.packageName,
        appName: whitelistApp.appName,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all whitelist apps
 * GET /api/v1/admin/whitelist?page=1&limit=50
 */
const getWhitelist = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const whitelist = await GlobalWhitelist.find()
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await GlobalWhitelist.countDocuments();

    sendSuccess(res, 200, 'Whitelist retrieved successfully', {
      whitelist,
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
 * Update a whitelist app
 * PATCH /api/v1/admin/whitelist/:id
 */
const updateWhitelistApp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { packageName, appName } = req.body;

    const app = await GlobalWhitelist.findById(id);
    if (!app) {
      return sendError(res, 404, 'App not found in whitelist');
    }

    if (packageName) app.packageName = packageName.trim();
    if (appName) app.appName = appName.trim();

    await app.save();

    sendSuccess(res, 200, 'Whitelist app updated successfully', {
      app: {
        id: app._id,
        packageName: app.packageName,
        appName: app.appName,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an app from the whitelist
 * DELETE /api/v1/admin/whitelist/:id
 */
const removeFromWhitelist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const app = await GlobalWhitelist.findByIdAndDelete(id);
    if (!app) {
      return sendError(res, 404, 'App not found in whitelist');
    }

    sendSuccess(res, 200, 'App removed from whitelist successfully', {
      deletedApp: {
        id: app._id,
        packageName: app.packageName,
        appName: app.appName,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToWhitelist,
  getWhitelist,
  updateWhitelistApp,
  removeFromWhitelist,
};
