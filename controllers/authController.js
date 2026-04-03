const Admin = require("../models/Admin");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendSuccess, sendError } = require("../utils/response");
const { JWT_SECRET, JWT_EXPIRE, UserRoles } = require("../config/constant");

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

/**
 * User signup
 * POST /api/v1/auth/signup
 */
const signUpAsUser = async (req, res, next) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId || !deviceId.trim()) {
      return sendError(res, 400, "Please provide deviceId");
    }

    const normalizedDeviceId = deviceId.trim();

    let user = await User.findOne({ deviceId: normalizedDeviceId });
    if (user) {
      return sendError(res, 409, "User already exists");
    }

    user = await User.create({
      deviceId: normalizedDeviceId,
      role: UserRoles.USER,
    });

    const token = generateToken(user._id);

    sendSuccess(res, 201, "User signed up successfully", {
      token,
      user: {
        id: user._id,
        deviceId: user.deviceId,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const loginAsAdmin = async (username, password) => {
  try {
    if (!username || !password) {
      return sendError(res, 400, "Please provide username and password");
    }

    const normalizedUsername = username.toLowerCase().trim();
    const admin = await User.findOne({ username: normalizedUsername }).select(
      "+password",
    );

    if (!admin || !(await admin.matchPassword(password))) {
      return sendError(res, 401, "Invalid credentials");
    }

    const token = generateToken(admin._id);
    return {
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 * Login (user or admin)
 * POST /api/v1/auth/login?role=user|admin
 */
const login = async (req, res, next) => {
  try {
    const role = (req.query.role || "").toLowerCase();

    if (!role || !["user", "admin"].includes(role)) {
      return sendError(res, 400, 'Invalid role. Use "user" or "admin"');
    }

    if (role === "admin") {
      const { username, password } = req.body;
      const data = await loginAsAdmin(username, password);
      return sendSuccess(res, 200, "Login successful", data)
    }

    // User login
    const { deviceId } = req.body;
    if (!deviceId || !deviceId.trim()) {
      return sendError(res, 400, "Please provide deviceId");
    }

    const normalizedDeviceId = deviceId.trim();

    const user = await User.findOne({ deviceId: normalizedDeviceId });
    if (!user) {
      return sendError(res, 401, "Invalid credentials");
    }

    const token = generateToken(user._id);

    return sendSuccess(res, 200, "Login successful", {
      token,
      user: {
        id: user._id,
        deviceId: user.deviceId,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Current Authenticated User
 * GET /api/v1/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendError(res, 401, "No authenticated user");
    }

    const me = await User.findById(req.user.id).select("-password").lean();

    sendSuccess(res, 200, "User profile retrieved", {
      user: {
        id: me._id,
        role: me.role,
        username: me.username || null,
        deviceId: me.deviceId || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  signUpAsUser,
};
