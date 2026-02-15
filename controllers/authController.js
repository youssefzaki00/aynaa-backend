const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { sendSuccess, sendError } = require('../utils/response');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/constant');

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

/**
 * Admin Login
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, 400, 'Please provide username and password');
    }

    // Check for admin
    const admin = await Admin.findOne({ username }).select('+password');

    if (!admin) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Check password
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    // Create token
    const token = generateToken(admin._id);

    sendSuccess(res, 200, 'Login successful', {
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Current Admin
 * GET /api/v1/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.user.id);

    sendSuccess(res, 200, 'Admin profile retrieved', {
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
};
