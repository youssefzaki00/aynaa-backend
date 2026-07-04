const mongoose = require('mongoose');

const excludedAppSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: [true, 'Package name is required'],
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
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

// Index for faster queries
excludedAppSchema.index({ isActive: 1 });
excludedAppSchema.index({ updatedAt: 1 });
excludedAppSchema.index({ createdAt: 1 });
excludedAppSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('ExcludedApp', excludedAppSchema);