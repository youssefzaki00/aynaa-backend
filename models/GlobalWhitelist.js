const mongoose = require('mongoose');
const crypto = require('crypto');

const globalWhitelistSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      default: () => crypto.randomUUID(),
      unique: true,
      index: true,
    },
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
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret.uuid;
        delete ret._id;
        delete ret.uuid;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('GlobalWhitelist', globalWhitelistSchema);
