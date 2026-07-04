const mongoose = require("mongoose");

const siteSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "URL is required"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

siteSchema.index({ updatedAt: 1 });
siteSchema.index({ createdAt: 1 });
siteSchema.index({ deletedAt: 1 });

module.exports = mongoose.model("Site", siteSchema);
