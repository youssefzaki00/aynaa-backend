const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { UserRoles } = require("../../config/constant");
const { runId, track } = require("./testContext");

const createTestAdminToken = async () => {
  const admin = await User.create({
    username: `admin-${runId}`,
    password: "test-password",
    role: UserRoles.ADMIN,
  });
  track("users", admin._id);

  const token = jwt.sign(
    { id: admin._id.toString(), role: UserRoles.ADMIN },
    process.env.JWT_SECRET,
  );

  return { token, userId: admin._id };
};

const createTestUserToken = async () => {
  const user = await User.create({
    deviceId: `device-${runId}`,
    role: UserRoles.USER,
  });
  track("users", user._id);

  const token = jwt.sign(
    { id: user._id.toString(), role: UserRoles.USER },
    process.env.JWT_SECRET,
  );

  return { token, userId: user._id };
};

module.exports = { createTestAdminToken, createTestUserToken };
