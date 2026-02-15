const mongoose = require('mongoose');
const crypto = require('crypto');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    customBlockedKeywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    customAllowedKeywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    customWhitelistedApps: [
      {
        type: String, // package name
        trim: true,
      },
    ],
    customBlacklistedApps: [
      {
        type: String, // package name
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for faster queries
deviceSchema.index({ lastSeen: -1 });
deviceSchema.index({ isBanned: 1 });

module.exports = mongoose.model('Device', deviceSchema);
