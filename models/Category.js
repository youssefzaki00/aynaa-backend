const mongoose = require('mongoose');
const crypto = require('crypto');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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
        delete ret._id
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for faster filtering
categorySchema.index({ isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
