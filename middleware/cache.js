const { getRedisClient, isRedisReady } = require("../config/redis");

/**
 * Global Redis cache middleware for authenticated GET endpoints.
 * Only caches when there are zero query parameters (full-list requests).
 * Responses are never stored at CDN/browser (see apiCacheHeaders).
 */
const cacheResponse = (cacheKey, ttlSeconds) => {
  return async (req, res, next) => {
    if (Object.keys(req.query).length > 0) {
      return next();
    }

    if (!isRedisReady()) {
      return next();
    }

    const redis = getRedisClient();

    try {
      const cached = await redis.get(cacheKey);

      if (cached) {
        res.set("X-Cache", "HIT");
        return res.type("application/json").send(cached);
      }
    } catch (err) {
      console.error(`[Cache] GET failed for ${cacheKey}:`, err.message);
      return next();
    }

    res.set("X-Cache", "MISS");

    const originalJson = res.json.bind(res);

    res.json = (body) => {
      if (res.statusCode === 200) {
        const payload = JSON.stringify(body);
        redis
          .set(cacheKey, payload, { EX: ttlSeconds })
          .catch((err) =>
            console.error(`[Cache] SET failed for ${cacheKey}:`, err.message),
          );
      }

      return originalJson(body);
    };

    return next();
  };
};

module.exports = { cacheResponse };
