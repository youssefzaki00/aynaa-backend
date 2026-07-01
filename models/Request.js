const mongoose = require('mongoose');
const { REQUEST_STATUSES } = require('../config/constant');

const requestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User',
      index: true,
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
      index: true,
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
  }
);

requestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);
