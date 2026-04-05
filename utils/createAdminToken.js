require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");
const jwt = require('jsonwebtoken');
const { UserRoles } = require("../config/constant");

const createAdminToken = async () => {
  let db;
  try {
    db = await connectDB();

    // Check if admin exists
    let admin = await User.findOne({ role: UserRoles.ADMIN }).lean();
    // If not admin create admin
    if (!admin) {
      admin = await User.create({
        username: "anyusername",
        password: "anypassword",
        role: UserRoles.ADMIN,
      });
    }
    const token = jwt.sign({id: admin._id.toString(), role: UserRoles.ADMIN}, process.env.JWT_SECRET)
    return token
  } catch (error) {
    console.error("Error creating token:", error.message);
  }
  await db.disconnect;
};

module.exports = {createAdminToken}