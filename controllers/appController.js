const { sendSuccess, sendError } = require('../utils/response');
const { validateRequiredFields } = require('../utils/validation');
const { buildCacheKey, getOrSetCache, invalidateNamespace } = require('../utils/cache');
const {
  createApp,
  getApps,
  getAppById,
  getAppByPackageName,
  updateApp,
  deleteApp,
} = require('../services/app.service');

const APPS_CACHE_NS = 'apps';

const createAppController = async (req, res, next) => {
  try {
    const { packageName } = req.body;

    const validation = validateRequiredFields(req.body, ['packageName']);
    if (!validation.valid) {
      return sendError(res, 400, `Missing required fields: ${validation.missing.join(', ')}`);
    }

    const existing = await getAppByPackageName(packageName);
    if (existing) {
      return sendError(res, 409, 'App with this package name already exists');
    }

    const app = await createApp({
      packageName: packageName.trim(),
    });

    void invalidateNamespace(APPS_CACHE_NS);

    return sendSuccess(res, 201, 'App created successfully', {
      app: {
        id: app.id,
        packageName: app.packageName,
        isDeleted: app.isDeleted,
        isActive: app.isActive,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      },
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
    const { lastSync } = req.query;

    if (lastSync) {
      const { apps, deletedIds } = await getApps(lastSync);
      return sendSuccess(res, 200, 'Apps retrieved successfully', {
        apps: apps.map((app) => ({
          id: app.id,
          packageName: app.packageName,
          isDeleted: app.isDeleted,
          isActive: app.isActive,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        })),
        deletedIds,
      });
    }

    const cacheKey = buildCacheKey(APPS_CACHE_NS);
    const { data } = await getOrSetCache(cacheKey, async () => {
      const { apps, deletedIds } = await getApps();
      return {
        apps: apps.map((app) => ({
          id: app.id,
          packageName: app.packageName,
          isDeleted: app.isDeleted,
          isActive: app.isActive,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        })),
        deletedIds,
      };
    });

    return sendSuccess(res, 200, 'Apps retrieved successfully', data);
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
    if (isDeleted !== undefined) updates.isDeleted = Boolean(isDeleted);
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, 'No valid fields to update');
    }

    const app = await updateApp(id, updates);
    void invalidateNamespace(APPS_CACHE_NS);
    return sendSuccess(res, 200, 'App updated successfully', {
      app: {
        id: app.id,
        packageName: app.packageName,
        isDeleted: app.isDeleted,
        isActive: app.isActive,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      },
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
    const existing = await getAppById(id);
    if (!existing) {
      return sendError(res, 404, 'App not found');
    }

    await deleteApp(id);
    void invalidateNamespace(APPS_CACHE_NS);
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
