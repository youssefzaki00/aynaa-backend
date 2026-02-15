const mongoose = require('mongoose');
const crypto = require('crypto');

const keywordSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      default: () => crypto.randomUUID(),
      unique: true,
      index: true,
    },
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

// Index for faster filtering
keywordSchema.index({ isEnabled: 1, category: 1 });

module.exports = mongoose.model('Keyword', keywordSchema);
