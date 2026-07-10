const ExcludedApp = require('./ExcludedApp');
const { executePaginatedQuery } = require('../utils/pagination');

exports.createExcludedApp = async (packageName) => {
  const excludedApp = await ExcludedApp.create({
    packageName: packageName.trim(),
    isActive: true,
  });
  return excludedApp;
};

exports.getExcludedApps = async ({ lastSync, search, query = {} } = {}) => {
  const filter = { deletedAt: null };
  let deleted = [];

  if (lastSync) {
    const since = new Date(lastSync);
    filter.$or = [
      { createdAt: { $gt: since } },
      { updatedAt: { $gt: since } },
    ];
    const tombstones = await ExcludedApp.find({ deletedAt: { $gt: since } }).select('_id');
    deleted = tombstones.map((d) => d._id);
  }

  const { items, pagination } = await executePaginatedQuery({
    model: ExcludedApp,
    filter,
    query: { ...query, search },
    searchFields: ['packageName'],
  });

  return { excludedApps: items, deleted, pagination };
};

exports.updateExcludedApp = async (id, updates) => {
  const excludedApp = await ExcludedApp.findOneAndUpdate(
    { _id: id, deletedAt: null },
    updates,
    { new: true, runValidators: true }
  );
  return excludedApp;
};

exports.restoreExcludedApp = async (id, updates = {}) => {
  const excludedApp = await ExcludedApp.findOneAndUpdate(
    { _id: id, deletedAt: { $ne: null } },
    { ...updates, deletedAt: null },
    { new: true, runValidators: true }
  );
  return excludedApp;
};

exports.deleteExcludedApp = async (id) => {
  const excludedApp = await ExcludedApp.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  return excludedApp;
};

exports.getExcludedAppById = async (id) => {
  const excludedApp = await ExcludedApp.findOne({ _id: id, deletedAt: null });
  return excludedApp;
};

exports.getExcludedAppByIdAny = async (id) => {
  const excludedApp = await ExcludedApp.findById(id);
  return excludedApp;
};

exports.getExcludedAppByPackageNameAny = async (packageName) => {
  const excludedApp = await ExcludedApp.findOne({ packageName: packageName.trim() });
  return excludedApp;
};
