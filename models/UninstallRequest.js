const mongoose = require('mongoose');
const crypto = require('crypto');

const uninstallRequestSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      default: () => crypto.randomUUID(),
      unique: true,
      index: true,
    },
    deviceId: {
      type: String,
      ref: 'Device',
      required: [true, 'Device ID is required'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    adminNote: {
      type: String,
      default: null,
    },
    unlockCode: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
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

// Index for faster queries
uninstallRequestSchema.index({ deviceId: 1, status: 1 });
uninstallRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('UninstallRequest', uninstallRequestSchema);
