require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const connectDB = require('../config/db');

const args = process.argv.slice(2);
const username = args[0];
const password = args[1];

if (!username || !password) {
  console.log('Usage: node scripts/create-admin.js <username> <password>');
  process.exit(1);
}

const createAdmin = async () => {
  try {
    await connectDB();

    // Check if admin exists
    const adminExists = await Admin.findOne({ username });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(1);
    }

    // Create admin
    const admin = await Admin.create({
      username,
      password,
      role: 'superadmin',
    });

    console.log(`Admin user created successfully: ${admin.username}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
