const GlobalWhitelist = require('../models/GlobalWhitelist');
const { sendSuccess, sendError } = require('../utils/response');
const { executePaginatedQuery } = require('../utils/pagination');
const { validateRequiredFields } = require('../utils/validation');

/**
 * Add an app to the global whitelist
 * POST /api/v1/admin/whitelist
 */
const addToWhitelist = async (req, res, next) => {
  try {
    const { packageName, appName } = req.body;

    const validation = validateRequiredFields(req.body, ['packageName', 'appName']);
    if (!validation.valid) {
      return sendError(res, 400, `Missing required fields: ${validation.missing.join(', ')}`);
    }

    const whitelistApp = await GlobalWhitelist.create({
      packageName: packageName.trim(),
      appName: appName.trim(),
    });

    sendSuccess(res, 201, 'App added to whitelist successfully', {
      app: {
        id: whitelistApp.uuid,
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
    const { items: whitelist, pagination } = await executePaginatedQuery({
      model: GlobalWhitelist,
      query: req.query,
    });

    // Map whitelist items to include id field
    const formattedWhitelist = whitelist.map(app => ({
      id: app.uuid,
      packageName: app.packageName,
      appName: app.appName,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));

    sendSuccess(res, 200, 'Whitelist retrieved successfully', {
      whitelist: formattedWhitelist,
      pagination,
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

    const app = await GlobalWhitelist.findOne({ uuid: id });
    if (!app) {
      return sendError(res, 404, 'App not found in whitelist');
    }

    if (packageName) app.packageName = packageName.trim();
    if (appName) app.appName = appName.trim();

    await app.save();

    sendSuccess(res, 200, 'Whitelist app updated successfully', {
      app: {
        id: app.uuid,
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

    const app = await GlobalWhitelist.findOneAndDelete({ uuid: id });
    if (!app) {
      return sendError(res, 404, 'App not found in whitelist');
    }

    sendSuccess(res, 200, 'App removed from whitelist successfully', {
      deletedApp: {
        id: app.uuid,
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
