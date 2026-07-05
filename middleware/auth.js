// API Key Authentication Middleware
const { API_SECRET_KEY, ADMIN_API_KEY } = require("../config/env");

const authenticateAPI = (req, res, next) => {
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No API key provided.",
    });
  }

  if (apiKey !== API_SECRET_KEY) {
    return res.status(403).json({
      success: false,
      message: "Invalid API key.",
    });
  }

  next();
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/constant');

// Protect routes - JWT Verification + DB user lookup
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get admin from the token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Access denied. User not found.",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token.",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }
};

/**
 * Lightweight auth for global read-only cache-hit routes.
 * Verifies JWT only — no MongoDB lookup. Controllers on these routes
 * must not depend on req.user fields beyond id.
 */
const protectLight = (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Invalid token.",
    });
  }
};

// Deprecated: Legacy Admin Authentication Middleware (Will be removed)
const authenticateAdmin = (req, res, next) => {
  const adminKey = req.header("x-admin-key");

  if (!adminKey) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No admin key provided.",
    });
  }

  if (adminKey !== ADMIN_API_KEY) {
    return res.status(403).json({
      success: false,
      message: "Invalid admin key.",
    });
  }

  next();
};

module.exports = { authenticateAPI, authenticateAdmin, protect, protectLight };
