const ExcludedApp = require('./ExcludedApp');

exports.createExcludedApp = async (packageName) => {
  const excludedApp = await ExcludedApp.create({
    packageName: packageName.trim(),
    isActive: true,
  });
  return excludedApp;
};

exports.getExcludedApps = async (lastSync) => {
  const filter = { deletedAt: null };
  let deletedIds = [];

  if (lastSync) {
    const since = new Date(lastSync);
    filter.$or = [
      { createdAt: { $gt: since } },
      { updatedAt: { $gt: since } },
    ];
    const tombstones = await ExcludedApp.find({ deletedAt: { $gt: since } }).select('_id');
    deletedIds = tombstones.map((d) => d._id);
  }

  const excludedApps = await ExcludedApp.find(filter).sort({ createdAt: -1 });
  return { excludedApps, deletedIds };
};

exports.updateExcludedApp = async (id, updates) => {
  const excludedApp = await ExcludedApp.findOneAndUpdate(
    { _id: id, deletedAt: null },
    updates,
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
