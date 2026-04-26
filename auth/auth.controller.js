const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/response");
const { UserRoles } = require("../config/constant");
const { loginAsAdmin, loginAsUser } = require("./auth.service");
const { generateToken } = require("./utils/generateJwtToken");

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

/**
 * User login
 * POST /api/v1/auth/user/login
 */
const loginUser = async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    const data = await loginAsUser(deviceId);
    if (!data) {
      return sendError(res, 401, "Invalid credentials");
    }
    return sendSuccess(res, 200, "Login successful", data);
  } catch (error) {
    if (error.message === "Please provide deviceId") {
      return sendError(res, 400, error.message);
    }
    next(error);
  }
};

/**
 * Admin login
 * POST /api/v1/auth/admin/login
 */
const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const data = await loginAsAdmin(username, password);
    if (!data) {
      return sendError(res, 401, "Invalid credentials");
    }
    return sendSuccess(res, 200, "Login successful", data);
  } catch (error) {
    if (error.message === "Please provide username and password") {
      return sendError(res, 400, error.message);
    }
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
  loginUser,
  loginAdmin,
  getMe,
  signUpAsUser,
};
