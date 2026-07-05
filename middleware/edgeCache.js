const { CDN_CACHE_MAX_AGE } = require("../constants/cacheKeys");

/**
 * Sets Cache-Control + Cache-Tag for Cloudflare edge caching and tag-based purge.
 */
const edgeCache = (maxAgeSeconds = CDN_CACHE_MAX_AGE, cacheTag = null) => {
  return (req, res, next) => {
    res.set("Cache-Control", `public, max-age=${maxAgeSeconds}`);
    if (cacheTag) {
      res.set("Cache-Tag", cacheTag);
    }
    next();
  };
};

module.exports = { edgeCache };
