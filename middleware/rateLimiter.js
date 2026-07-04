const rateLimit = require('express-rate-limit');

// Absurdly high caps — effectively unlimited for normal use (per IP per window)
const HUGE_MAX = 9999999999999;

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: HUGE_MAX,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: HUGE_MAX,
  message: {
    success: false,
    message: 'Too many requests. Please wait before submitting again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

module.exports = { globalLimiter, strictLimiter };
