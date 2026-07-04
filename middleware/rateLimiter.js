const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { sendRedisCommand } = require("../config/redis");

// Absurdly high caps — effectively unlimited for normal use (per IP per window)
const HUGE_MAX = 9999999999999;

// Redis-backed store shared across cluster workers. In tests we fall back to the
// default in-memory store because the test suite imports `app` without running
// connectRedis().
const createRedisStore = (prefix) => {
  if (process.env.NODE_ENV === "test") {
    return undefined;
  }

  return new RedisStore({
    prefix,
    sendCommand: (...args) => sendRedisCommand(...args),
  });
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: HUGE_MAX,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("rl:global:"),
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: HUGE_MAX,
  message: {
    success: false,
    message: "Too many requests. Please wait before submitting again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  store: createRedisStore("rl:strict:"),
});

module.exports = { globalLimiter, strictLimiter };
