const mongoose = require('mongoose');
const crypto = require('crypto');

const suggestionSchema = new mongoose.Schema(
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
      required: false,
    },
    type: {
      type: String,
      enum: ['BLOCK_WORD', 'UNBLOCK_WORD', 'WHITELIST_APP'],
      required: [true, 'Suggestion type is required'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    note: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
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
suggestionSchema.index({ status: 1, type: 1 });
suggestionSchema.index({ deviceId: 1 });

module.exports = mongoose.model('Suggestion', suggestionSchema);
