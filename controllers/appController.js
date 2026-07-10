const { sendSuccess, sendError } = require('../utils/response');
const { validateRequiredFields } = require('../utils/validation');
const { invalidateListCache } = require('../utils/cacheInvalidate');
const {
  createApp,
  getApps,
  getAppById,
  getAppByIdAny,
  getAppByPackageName,
  getAppByPackageNameAny,
  updateApp,
  restoreApp,
  deleteApp,
} = require('../services/app.service');

const formatAppForApi = (app) => ({
  id: app.id,
  packageName: app.packageName,
  isDeleted: Boolean(app.deletedAt),
  isActive: app.isActive,
  createdAt: app.createdAt,
  updatedAt: app.updatedAt,
});

const createAppController = async (req, res, next) => {
  try {
    const { packageName } = req.body;

    const validation = validateRequiredFields(req.body, ['packageName']);
    if (!validation.valid) {
      return sendError(res, 400, `Missing required fields: ${validation.missing.join(', ')}`);
    }

    const trimmedPackage = packageName.trim();
    const existing = await getAppByPackageNameAny(trimmedPackage);

    if (existing) {
      if (!existing.deletedAt) {
        return sendError(res, 409, 'App with this package name already exists');
      }

      const restored = await restoreApp(existing._id, { packageName: trimmedPackage });
      await invalidateListCache('APPS');

      return sendSuccess(res, 200, 'App restored successfully', {
        app: formatAppForApi(restored),
      });
    }

    const app = await createApp({ packageName: trimmedPackage });

    await invalidateListCache('APPS');

    return sendSuccess(res, 201, 'App created successfully', {
      app: formatAppForApi(app),
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'App with this package name already exists');
    }
    return next(error);
  }
};

const getAppsController = async (req, res, next) => {
  try {
    const { lastSync, search } = req.query;
    const { apps, deleted, pagination } = await getApps({
      lastSync,
      search,
      query: req.query,
    });

    return sendSuccess(res, 200, 'Apps retrieved successfully', {
      items: apps.map(formatAppForApi),
      deleted,
      pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const updateAppController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { packageName, isDeleted, isActive } = req.body;

    const existing = await getAppById(id);
    if (!existing) {
      return sendError(res, 404, 'App not found');
    }

    const updates = {};
    if (packageName !== undefined) {
      if (packageName.trim() !== existing.packageName) {
        const conflict = await getAppByPackageName(packageName);
        if (conflict) {
          return sendError(res, 409, 'App with this package name already exists');
        }
        updates.packageName = packageName.trim();
      }
    }
    if (isDeleted !== undefined) {
      updates.deletedAt = isDeleted ? new Date() : null;
    }
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, 'No valid fields to update');
    }

    const app = await updateApp(id, updates);

    await invalidateListCache('APPS');

    return sendSuccess(res, 200, 'App updated successfully', {
      app: formatAppForApi(app),
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'App with this package name already exists');
    }
    return next(error);
  }
};

const deleteAppController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await getAppByIdAny(id);

    if (!existing) {
      return sendError(res, 404, 'App not found');
    }

    if (existing.deletedAt) {
      return sendSuccess(res, 200, 'App deleted successfully', {
        deletedApp: {
          id: existing.id,
          packageName: existing.packageName,
        },
      });
    }

    await deleteApp(id);

    await invalidateListCache('APPS');

    return sendSuccess(res, 200, 'App deleted successfully', {
      deletedApp: {
        id: existing.id,
        packageName: existing.packageName,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createAppController,
  getAppsController,
  updateAppController,
  deleteAppController,
};
