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

// GET /sites — active list + default sort
siteSchema.index({ deletedAt: 1, createdAt: -1 });
// Filtered list: isActive, categoryId
siteSchema.index({ deletedAt: 1, isActive: 1, category: 1, createdAt: -1 });
// lastSync incremental + soft-delete tombstones
siteSchema.index({ deletedAt: 1, updatedAt: 1 });
// Sites per category (upload / admin views)
siteSchema.index({ category: 1, deletedAt: 1 });

module.exports = mongoose.model("Site", siteSchema);
