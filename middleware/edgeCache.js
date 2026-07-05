const { CDN_CACHE_MAX_AGE } = require("../constants/cacheKeys");

/**
 * Sets Cache-Control for Cloudflare edge caching.
 * Independent of Redis server-side cache (see middleware/cache.js).
 */
const edgeCache = (maxAgeSeconds = CDN_CACHE_MAX_AGE) => {
  return (req, res, next) => {
    res.set("Cache-Control", `public, max-age=${maxAgeSeconds}`);
    next();
  };
};

module.exports = { edgeCache };
