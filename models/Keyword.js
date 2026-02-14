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
      type: String,
      enum: ['PORN', 'GAMBLING', 'ATHEISM', 'VIOLENCE', 'OTHER'],
      required: [true, 'Category is required'],
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster filtering
keywordSchema.index({ isEnabled: 1, category: 1 });

module.exports = mongoose.model('Keyword', keywordSchema);
