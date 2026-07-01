const App = require('../models/App');

exports.createApp = async (payload) => {
  const app = await App.create(payload);
  return app;
};

exports.getApps = async (lastSync) => {
  const filter = {};
  if (lastSync) {
    filter.$or = [
      { createdAt: { $gt: new Date(lastSync) } },
      { updatedAt: { $gt: new Date(lastSync) } },
    ];
  }
  const apps = await App.find(filter).sort({ createdAt: -1 });
  return apps;
};

exports.getAppById = async (id) => {
  const app = await App.findById(id);
  return app;
};

exports.getAppByPackageName = async (packageName) => {
  const app = await App.findOne({ packageName: packageName.trim() });
  return app;
};

exports.updateApp = async (id, updates) => {
  const app = await App.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  return app;
};

exports.deleteApp = async (id) => {
  const app = await App.findByIdAndDelete(id);
  return app;
};
