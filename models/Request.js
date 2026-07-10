const mongoose = require('mongoose');
const { REQUEST_STATUSES } = require('../config/constant');

const requestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['UNINSTALL'],
      required: [true, 'Request type is required'],
    },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: 'PENDING',
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// GET /requests — user's own list
requestSchema.index({ userId: 1, createdAt: -1 });
// Filter by type (user or admin)
requestSchema.index({ userId: 1, type: 1, createdAt: -1 });
requestSchema.index({ type: 1, createdAt: -1 });
// Admin: all requests, newest first
requestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);
