const ExcludedApp = require('./ExcludedApp');

exports.createExcludedApp = async (packageName) => {
  const excludedApp = await ExcludedApp.create({
    packageName: packageName.trim(),
    isActive: true,
  });
  return excludedApp;
};

exports.getExcludedApps = async (lastSync) => {
  const filter = {};

  if (lastSync) {
    filter.$or = [
      { createdAt: { $gt: new Date(lastSync) } },
      { updatedAt: { $gt: new Date(lastSync) } }
    ];
  }

  const excludedApps = await ExcludedApp.find(filter).sort({ createdAt: -1 });
  return excludedApps;
};

exports.updateExcludedApp = async (id, updates) => {
  const excludedApp = await ExcludedApp.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  );
  return excludedApp;
};

exports.deleteExcludedApp = async (id) => {
  const excludedApp = await ExcludedApp.findByIdAndDelete(id);
  return excludedApp;
};

exports.getExcludedAppById = async (id) => {
  const excludedApp = await ExcludedApp.findById(id);
  return excludedApp;
};