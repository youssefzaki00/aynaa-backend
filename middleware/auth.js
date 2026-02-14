// API Key Authentication Middleware
const authenticateAPI = (req, res, next) => {
  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No API key provided.',
    });
  }

  if (apiKey !== process.env.API_SECRET_KEY) {
    return res.status(403).json({
      success: false,
      message: 'Invalid API key.',
    });
  }

  next();
};

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  const adminKey = req.header('x-admin-key');

  if (!adminKey) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No admin key provided.',
    });
  }

  if (adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({
      success: false,
      message: 'Invalid admin key.',
    });
  }

  next();
};

module.exports = { authenticateAPI, authenticateAdmin };
