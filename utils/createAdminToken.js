require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const connectDB = require("../config/db");
const jwt = require('jsonwebtoken')

const createAdminToken = async () => {
  let db;
  try {
    db = await connectDB();

    // Check if admin exists
    const admin = await Admin.findOne({ role: "superadmin" });

    // If not admin create admin
    if (!admin) {
      const admin = await Admin.create({
        username: "anyusername",
        password: "anypassword",
        role: "superadmin",
      });
    }
    const token = jwt.sign({id: admin.id, role: 'superadmin'}, process.env.JWT_SECRET)
    return token
  } catch (error) {
    console.error("Error creating token:", error.message);
  }
  await db.disconnect;
};

module.exports = {createAdminToken}