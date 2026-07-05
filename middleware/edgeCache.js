const { CDN_CACHE_MAX_AGE } = require("../config/env");

/**
 * Cloudflare edge cache for full-list GET requests (no query string).
 * Browser gets private/no-cache; CDN caches with long TTL — purged on mutations.
 */
const edgeCache = (maxAgeSeconds = CDN_CACHE_MAX_AGE, cacheTag = null) => {
  return (req, res, next) => {
    if (Object.keys(req.query).length > 0) {
      return next();
    }

    res.set("Cache-Control", "private, no-cache");
    res.set("CDN-Cache-Control", `public, max-age=${maxAgeSeconds}`);
    res.set("Cloudflare-CDN-Cache-Control", `public, max-age=${maxAgeSeconds}`);

    if (cacheTag) {
      res.set("Cache-Tag", cacheTag);
    }

    next();
  };
};

module.exports = { edgeCache };
