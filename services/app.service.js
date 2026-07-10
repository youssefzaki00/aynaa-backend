const App = require('../models/App');
const { executePaginatedQuery } = require('../utils/pagination');

exports.createApp = async (payload) => {
  const app = await App.create(payload);
  return app;
};

exports.getApps = async ({ lastSync, search, query = {} } = {}) => {
  const filter = { deletedAt: null };
  let deleted = [];

  if (lastSync) {
    const since = new Date(lastSync);
    filter.$or = [
      { createdAt: { $gt: since } },
      { updatedAt: { $gt: since } },
    ];
    const tombstones = await App.find({ deletedAt: { $gt: since } }).select('_id');
    deleted = tombstones.map((d) => d._id);
  }

  const { items, pagination } = await executePaginatedQuery({
    model: App,
    filter,
    query: { ...query, search },
    searchFields: ['packageName'],
  });

  return { apps: items, deleted, pagination };
};

exports.getAppById = async (id) => {
  const app = await App.findOne({ _id: id, deletedAt: null });
  return app;
};

exports.getAppByIdAny = async (id) => {
  const app = await App.findById(id);
  return app;
};

exports.getAppByPackageName = async (packageName) => {
  const app = await App.findOne({ packageName: packageName.trim(), deletedAt: null });
  return app;
};

exports.getAppByPackageNameAny = async (packageName) => {
  const app = await App.findOne({ packageName: packageName.trim() });
  return app;
};

exports.updateApp = async (id, updates) => {
  const app = await App.findOneAndUpdate(
    { _id: id, deletedAt: null },
    updates,
    { new: true, runValidators: true }
  );
  return app;
};

exports.restoreApp = async (id, updates = {}) => {
  const app = await App.findOneAndUpdate(
    { _id: id, deletedAt: { $ne: null } },
    { ...updates, deletedAt: null },
    { new: true, runValidators: true }
  );
  return app;
};

exports.deleteApp = async (id) => {
  const app = await App.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  return app;
};
