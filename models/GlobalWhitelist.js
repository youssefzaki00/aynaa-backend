const mongoose = require('mongoose');

const globalWhitelistSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: [true, 'Package name is required'],
      unique: true,
      trim: true,
    },
    appName: {
      type: String,
      required: [true, 'App name is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GlobalWhitelist', globalWhitelistSchema);
