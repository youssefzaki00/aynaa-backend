const mongoose = require('mongoose');
const crypto = require('crypto');

const customizationRequestSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      default: () => crypto.randomUUID(),
      unique: true,
      index: true,
    },
    deviceId: {
      type: String, // Storing deviceId string directly to match Device model usage, or could be Ref if we want strict consistency. 
      // Device model has `deviceId` as a string field, and `_id` as ObjectId. 
      // Suggestion model uses `ref: 'Device'`, which implies ObjectId. 
      // However, the `Device` model uses a custom `deviceId` string as the main identifier for API calls.
      // Let's use String `deviceId` for easier querying by the device's own ID, 
      // OR use ObjectId and populate. 
      // Looking at `Suggestion.js`: `deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' }`.
      // But `Device.js` main key is `deviceId` string.
      // Let's try to be consistent with `Suggestion.js` if it works, BUT `Suggestion.js` might be hard to use if we only have `deviceId` string from client.
      // Actually, looking at `Suggestion.js` again in previous turn: it refers to 'Device'.
      // Only `deviceId` string is sent from client.
      // For simplicity/performance in this specific flow, let's store `deviceId` STRING as well/instead?
      // Actually, let's stick to reference for data integrity, but we'll need to look up the Device _id when saving.
      // WAIT. `Suggestion.js` usage in `suggestionController.js` (not seen yet) probably does a lookup.
      // Let's use the `deviceId` STRING for now because that's what the client sends and what we use for config sync.
      // It avoids an extra lookup just to submit a request if we don't strictly need the ObjectId link for population right away.
      // Actually, if we delete a device, we might want requests to go too?
      // Let's use `deviceId` (String) AND a reference if possible, or just `deviceId` (String) to match the `Device` model's primary business key.
      // The `Device` model has `deviceId` as a unique index.
      type: String,
      required: true,
      ref: 'Device', // This might not work directly if `deviceId` in Device isn't `_id`. 
      // Mongoose refs usually point to `_id`. 
      // Let's just store the string `deviceId` as it acts as the foreign key in our domain logic.
    },
    type: {
      type: String,
      enum: [
        'CUSTOM_BLOCK_KEYWORD',
        'CUSTOM_ALLOW_KEYWORD',
        'CUSTOM_WHITELIST_APP',
        'CUSTOM_BLACKLIST_APP',
      ],
      required: [true, 'Request type is required'],
    },
    content: {
      type: String,
      required: [true, 'Content (keyword or package name) is required'],
      trim: true,
    },
    appName: {
      type: String, // Optional, for whitelist/blacklist apps
      trim: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    adminNote: {
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
customizationRequestSchema.index({ status: 1, type: 1 });
customizationRequestSchema.index({ deviceId: 1 });

module.exports = mongoose.model('CustomizationRequest', customizationRequestSchema);
