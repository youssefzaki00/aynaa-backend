const mongoose = require('mongoose');
const { REQUEST_STATUSES, VALIDATION_LIMITS } = require('../config/constant');

const requestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: VALIDATION_LIMITS.MAX_REQUEST_REASON_LENGTH,
    },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: 'PENDING',
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

requestSchema.index({ userId: 1, createdAt: -1 });
requestSchema.index({ userId: 1, status: 1 });
requestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);
