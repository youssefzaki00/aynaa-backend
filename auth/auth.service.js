const User = require("../models/User");
const { generateToken } = require("./utils/generateJwtToken");

exports.loginAsAdmin = async (username, password) => {
  if (!username || !password) {
    throw new Error("Please provide username and password");
  }

  const normalizedUsername = username.toLowerCase().trim();
  const admin = await User.findOne({ username: normalizedUsername }).select(
    "+password",
  );

  if (!admin || !(await admin.matchPassword(password))) {
    return null;
  }

  const token = generateToken(admin._id);
  return {
    token,
    admin: {
      id: admin._id,
      username: admin.username,
      role: admin.role,
    },
  };
};

exports.loginAsUser = async (deviceId) => {
  if (!deviceId || !deviceId.trim()) {
    throw new Error("Please provide deviceId");
  }

  const normalizedDeviceId = deviceId.trim();

  const user = await User.findOne({ deviceId: normalizedDeviceId });
  if (!user) {
    return null;
  }

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      deviceId: user.deviceId,
      role: user.role,
    },
  };
};
