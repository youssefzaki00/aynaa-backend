/**
 * Prevent browsers and CDNs from caching authenticated API responses.
 */
const apiCacheHeaders = (req, res, next) => {
  res.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
};

module.exports = { apiCacheHeaders };
