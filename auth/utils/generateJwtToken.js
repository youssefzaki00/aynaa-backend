const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRE } = require("../../config/constant");

/**
 * Generate JWT Token
 */
exports.generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};
