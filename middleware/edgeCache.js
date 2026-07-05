/**
 * Sets Cache-Control + Cache-Tag for Cloudflare edge caching and tag-based purge.
 * @deprecated List routes no longer use edge caching.
 */
const edgeCache = (maxAgeSeconds = 0, cacheTag = null) => {
  return (req, res, next) => {
    res.set("Cache-Control", `public, max-age=${maxAgeSeconds}`);
    if (cacheTag) {
      res.set("Cache-Tag", cacheTag);
    }
    next();
  };
};

module.exports = { edgeCache };
