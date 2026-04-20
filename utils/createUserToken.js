require("dotenv").config();
const User = require("../models/User");
const connectDB = require("../config/db");
const jwt = require("jsonwebtoken");
const { UserRoles } = require("../config/constant");
const { randomUUID } = require("crypto");

const createUserToken = async () => {
  let db;
  try {
    db = await connectDB();

    // Check if user exists
    let user = await User.findOne({ role: UserRoles.USER }).lean();
    // If not admin create admin
    if (!user) {
      user = await User.create({
        deviceId: randomUUID(),
        role: UserRoles.USER,
      });
    }
    const token = jwt.sign(
      { id: user._id.toString(), role: UserRoles.USER },
      process.env.JWT_SECRET,
    );
    return token;
  } catch (error) {
    console.error("Error creating token:", error.message);
  }
  await db.disconnect;
};

module.exports = { createUserToken };
