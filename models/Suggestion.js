const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
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
  }
);

// Index for faster queries
suggestionSchema.index({ status: 1, type: 1 });
suggestionSchema.index({ deviceId: 1 });

module.exports = mongoose.model('Suggestion', suggestionSchema);
