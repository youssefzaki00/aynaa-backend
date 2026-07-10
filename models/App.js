const mongoose = require('mongoose');

const appSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: [true, 'Package name is required'],
      unique: true,
      trim: true,
      maxlength: 200,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// GET /apps — active list + default sort
appSchema.index({ deletedAt: 1, createdAt: -1 });
// lastSync incremental + soft-delete tombstones
appSchema.index({ deletedAt: 1, updatedAt: 1 });
// Lookup / restore by package name
appSchema.index({ packageName: 1, deletedAt: 1 });

module.exports = mongoose.model('App', appSchema);
