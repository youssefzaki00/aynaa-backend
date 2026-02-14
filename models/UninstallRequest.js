const mongoose = require('mongoose');

const uninstallRequestSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
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
  }
);

// Index for faster queries
uninstallRequestSchema.index({ deviceId: 1, status: 1 });
uninstallRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('UninstallRequest', uninstallRequestSchema);
