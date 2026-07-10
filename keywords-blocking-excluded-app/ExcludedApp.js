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
  },
);

// GET /excluded-apps — active list + default sort
excludedAppSchema.index({ deletedAt: 1, createdAt: -1 });
// lastSync incremental + soft-delete tombstones
excludedAppSchema.index({ deletedAt: 1, updatedAt: 1 });
// Lookup / restore by package name
excludedAppSchema.index({ packageName: 1, deletedAt: 1 });

module.exports = mongoose.model('ExcludedApp', excludedAppSchema);
