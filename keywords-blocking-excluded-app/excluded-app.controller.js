const { sendSuccess, sendError } = require('../utils/response');
const { validateRequiredFields } = require('../utils/validation');
const { invalidateListCache } = require('../utils/cacheInvalidate');
const {
  createExcludedApp,
  getExcludedApps,
  updateExcludedApp,
  deleteExcludedApp,
  getExcludedAppById,
} = require('./excluded-app.service');

/**
 * Create a new excluded app
 * POST /api/v1/excluded-apps
 */
const createExcludedAppController = async (req, res, next) => {
  try {
    const { packageName } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, ['packageName']);
    if (!validation.valid) {
      return sendError(res, 400, `Missing required fields: ${validation.missing.join(', ')}`);
    }

    // Check if package name already exists
    const existingApp = await require('./ExcludedApp').findOne({ packageName: packageName.trim() });
    if (existingApp) {
      return sendError(res, 409, 'Excluded app with this package name already exists');
    }

    const excludedApp = await createExcludedApp(packageName);

    await invalidateListCache('EXCLUDED_APPS');

    sendSuccess(res, 201, 'Excluded app created successfully', {
      excludedApp: {
        id: excludedApp.id,
        packageName: excludedApp.packageName,
        isActive: excludedApp.isActive,
        createdAt: excludedApp.createdAt,
        updatedAt: excludedApp.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all excluded apps with optional lastSync filter
 * GET /api/v1/excluded-apps?lastSync=<Date>
 */
const getExcludedAppsController = async (req, res, next) => {
  try {
    const { lastSync } = req.query;

    const { excludedApps, deletedIds } = await getExcludedApps(lastSync);

    sendSuccess(res, 200, 'Excluded apps retrieved successfully', {
      excludedApps: excludedApps.map((app) => ({
        id: app.id,
        packageName: app.packageName,
        isActive: app.isActive,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      })),
      deletedIds,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an excluded app
 * PATCH /api/v1/excluded-app/:id
 */
const updateExcludedAppController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { packageName, isActive } = req.body;

    const existingApp = await getExcludedAppById(id);
    if (!existingApp) {
      return sendError(res, 404, 'Excluded app not found');
    }

    const updates = {};
    if (packageName !== undefined) {
      // Check if new package name conflicts with existing
      if (packageName.trim() !== existingApp.packageName) {
        const conflictApp = await require('./ExcludedApp').findOne({ packageName: packageName.trim() });
        if (conflictApp) {
          return sendError(res, 409, 'Excluded app with this package name already exists');
        }
        updates.packageName = packageName.trim();
      }
    }

    if (isActive !== undefined) {
      updates.isActive = isActive;
    }

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, 'No valid fields to update');
    }

    const updatedApp = await updateExcludedApp(id, updates);

    await invalidateListCache('EXCLUDED_APPS');

    sendSuccess(res, 200, 'Excluded app updated successfully', {
      excludedApp: {
        id: updatedApp.id,
        packageName: updatedApp.packageName,
        isActive: updatedApp.isActive,
        createdAt: updatedApp.createdAt,
        updatedAt: updatedApp.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an excluded app
 * DELETE /api/v1/excluded-app/:id
 */
const deleteExcludedAppController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingApp = await getExcludedAppById(id);
    if (!existingApp) {
      return sendError(res, 404, 'Excluded app not found');
    }

    const deletedApp = await deleteExcludedApp(id);

    await invalidateListCache('EXCLUDED_APPS');

    sendSuccess(res, 200, 'Excluded app deleted successfully', {
      deletedExcludedApp: {
        id: deletedApp.id,
        packageName: deletedApp.packageName,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExcludedAppController,
  getExcludedAppsController,
  updateExcludedAppController,
  deleteExcludedAppController,
};
