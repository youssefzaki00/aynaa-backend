const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: [true, 'Keyword is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    isEnabled: {
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

// GET /keywords — active list + default sort
keywordSchema.index({ deletedAt: 1, createdAt: -1 });
// Filtered list: categoryId, isEnabled
keywordSchema.index({ deletedAt: 1, category: 1, isEnabled: 1, createdAt: -1 });
// lastSync incremental + soft-delete tombstones
keywordSchema.index({ deletedAt: 1, updatedAt: 1 });
// Category delete guard: count keywords per category
keywordSchema.index({ category: 1, deletedAt: 1 });

module.exports = mongoose.model('Keyword', keywordSchema);
