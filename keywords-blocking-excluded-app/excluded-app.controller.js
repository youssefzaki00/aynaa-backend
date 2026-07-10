const { sendSuccess, sendError } = require('../utils/response');
const { validateRequiredFields } = require('../utils/validation');
const { invalidateListCache } = require('../utils/cacheInvalidate');
const {
  createExcludedApp,
  getExcludedApps,
  updateExcludedApp,
  restoreExcludedApp,
  deleteExcludedApp,
  getExcludedAppById,
  getExcludedAppByIdAny,
  getExcludedAppByPackageNameAny,
} = require('./excluded-app.service');

const formatExcludedAppForApi = (app) => ({
  id: app.id,
  packageName: app.packageName,
  isActive: app.isActive,
  createdAt: app.createdAt,
  updatedAt: app.updatedAt,
});

/**
 * Create a new excluded app
 * POST /api/v1/excluded-apps
 */
const createExcludedAppController = async (req, res, next) => {
  try {
    const { packageName } = req.body;

    const validation = validateRequiredFields(req.body, ['packageName']);
    if (!validation.valid) {
      return sendError(res, 400, `Missing required fields: ${validation.missing.join(', ')}`);
    }

    const trimmedPackage = packageName.trim();
    const existingApp = await getExcludedAppByPackageNameAny(trimmedPackage);

    if (existingApp) {
      if (!existingApp.deletedAt) {
        return sendError(res, 409, 'Excluded app with this package name already exists');
      }

      const restored = await restoreExcludedApp(existingApp._id, {
        packageName: trimmedPackage,
      });

      await invalidateListCache('EXCLUDED_APPS');

      return sendSuccess(res, 200, 'Excluded app restored successfully', {
        excludedApp: formatExcludedAppForApi(restored),
      });
    }

    const excludedApp = await createExcludedApp(trimmedPackage);

    await invalidateListCache('EXCLUDED_APPS');

    sendSuccess(res, 201, 'Excluded app created successfully', {
      excludedApp: formatExcludedAppForApi(excludedApp),
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'Excluded app with this package name already exists');
    }
    next(error);
  }
};

/**
 * Get all excluded apps with optional lastSync filter
 * GET /api/v1/excluded-apps?lastSync=<Date>
 */
const getExcludedAppsController = async (req, res, next) => {
  try {
    const { lastSync, search } = req.query;

    const { excludedApps, deleted, pagination } = await getExcludedApps({
      lastSync,
      search,
      query: req.query,
    });

    sendSuccess(res, 200, 'Excluded apps retrieved successfully', {
      items: excludedApps.map(formatExcludedAppForApi),
      deleted,
      pagination,
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
      if (packageName.trim() !== existingApp.packageName) {
        const conflictApp = await getExcludedAppByPackageNameAny(packageName.trim());
        if (conflictApp && !conflictApp.deletedAt) {
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
      excludedApp: formatExcludedAppForApi(updatedApp),
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
    const existingApp = await getExcludedAppByIdAny(id);

    if (!existingApp) {
      return sendError(res, 404, 'Excluded app not found');
    }

    if (existingApp.deletedAt) {
      return sendSuccess(res, 200, 'Excluded app deleted successfully', {
        deletedExcludedApp: {
          id: existingApp.id,
          packageName: existingApp.packageName,
        },
      });
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
