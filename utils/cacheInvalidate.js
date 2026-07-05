const { getRedisClient, isRedisReady } = require("../config/redis");
const { LIST_CACHES } = require("../constants/cacheKeys");
const { purgeCloudflareCache } = require("./purgeCloudflareCache");

const invalidateCache = async (...keys) => {
  if (!isRedisReady() || !keys.length) {
    return;
  }

  try {
    await getRedisClient().del(keys);
  } catch (err) {
    console.error(
      `[Cache] Invalidation failed for [${keys.join(", ")}]:`,
      err.message,
    );
  }
};

/**
 * Purge Redis keys and Cloudflare edge cache for one or more list resources.
 * @param {...string} names - LIST_CACHES keys, e.g. 'KEYWORDS', 'SITES'
 */
const invalidateListCache = async (...names) => {
  const entries = names.map((name) => LIST_CACHES[name]).filter(Boolean);
  if (!entries.length) {
    return;
  }

  await Promise.all([
    invalidateCache(...entries.map((e) => e.redis)),
    purgeCloudflareCache(entries.map((e) => e.path)),
  ]);
};

module.exports = { invalidateCache, invalidateListCache };
