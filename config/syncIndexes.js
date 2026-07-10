/**
 * Ensure all Mongoose model indexes exist in MongoDB.
 * Called once after connect — aligns DB with schema definitions.
 */

const registerModels = () => {
  require('../models/User');
  require('../models/Category');
  require('../models/Keyword');
  require('../models/App');
  require('../models/Request');
  require('../site/Site');
  require('../keywords-blocking-excluded-app/ExcludedApp');
};

const syncAllIndexes = async () => {
  registerModels();
  const mongoose = require('mongoose');

  const results = await Promise.allSettled(
    mongoose.modelNames().map((name) => mongoose.model(name).syncIndexes()),
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(
      '⚠️  Some index sync operations failed:',
      failed.map((f) => f.reason?.message || f.reason),
    );
  }
};

module.exports = { syncAllIndexes };
