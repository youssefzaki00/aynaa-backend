/**
 * Input Sanitization Middleware
 * Sanitizes request body, query params, and params to prevent injection attacks
 */

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Trim whitespace
    let sanitized = input.trim();

    // Remove potentially dangerous characters for NoSQL injection
    sanitized = sanitized.replace(/[{}$]/g, '');

    return sanitized;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }

  return input;
};

/**
 * Middleware to sanitize all incoming request data
 */
const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }

  if (req.query) {
    req.query = sanitizeInput(req.query);
  }

  if (req.params) {
    req.params = sanitizeInput(req.params);
  }

  next();
};

module.exports = sanitizeRequest;
