const App = require('../models/App');
const { applySearchFilter } = require('../utils/search');

exports.createApp = async (payload) => {
  const app = await App.create(payload);
  return app;
};

exports.getApps = async ({ lastSync, search } = {}) => {
  const filter = { isDeleted: false };
  let deletedIds = [];

  if (lastSync) {
    const since = new Date(lastSync);
    filter.$or = [
      { createdAt: { $gt: since } },
      { updatedAt: { $gt: since } },
    ];
    const tombstones = await App.find({
      isDeleted: true,
      updatedAt: { $gt: since },
    }).select('_id');
    deletedIds = tombstones.map((a) => a._id);
  }

  applySearchFilter(filter, search, ['packageName']);

  const apps = await App.find(filter).sort({ createdAt: -1 });
  return { apps, deletedIds };
};

exports.getAppById = async (id) => {
  const app = await App.findOne({ _id: id, isDeleted: false });
  return app;
};

exports.getAppByPackageName = async (packageName) => {
  const app = await App.findOne({ packageName: packageName.trim(), isDeleted: false });
  return app;
};

exports.updateApp = async (id, updates) => {
  const app = await App.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updates,
    { new: true, runValidators: true }
  );
  return app;
};

exports.deleteApp = async (id) => {
  const app = await App.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  return app;
};
