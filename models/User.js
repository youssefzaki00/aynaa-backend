const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: false,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
    },
    username: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  if (!this.password) return next();
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Auth lookups: mobile login/signup, admin login
userSchema.index({ deviceId: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema);
