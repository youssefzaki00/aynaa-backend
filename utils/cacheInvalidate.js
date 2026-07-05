const { getRedisClient, isRedisReady } = require("../config/redis");
const { LIST_CACHES } = require("../constants/cacheKeys");
const { purgeCloudflareCache } = require("./purgeCloudflareCache");

const invalidateRedis = async (...keys) => {
  if (!isRedisReady() || !keys.length) {
    return;
  }

  try {
    await getRedisClient().del(keys);
  } catch (err) {
    console.error(
      `[Cache] Redis invalidation failed for [${keys.join(", ")}]:`,
      err.message,
    );
  }
};

/**
 * Purge Redis + Cloudflare CDN for one or more list resources.
 * Call after create, update, delete, toggle, or bulk import.
 * @param {...string} names - LIST_CACHES keys, e.g. 'KEYWORDS', 'SITES'
 */
const invalidateListCache = async (...names) => {
  const entries = names.map((name) => LIST_CACHES[name]).filter(Boolean);
  if (!entries.length) {
    return;
  }

  await Promise.all([
    invalidateRedis(...entries.map((e) => e.redis)),
    purgeCloudflareCache(entries),
  ]);
};

const clearAllListRedisKeys = async () => {
  const keys = Object.values(LIST_CACHES).map((entry) => entry.redis);
  await invalidateRedis(...keys);
};

/**
 * On deploy: clear Redis snapshots + purge CDN (one worker via lock).
 */
const refreshListCachesOnDeploy = async () => {
  const entries = Object.values(LIST_CACHES);
  await clearAllListRedisKeys();

  if (!isRedisReady()) {
    await purgeCloudflareCache(entries);
    return;
  }

  try {
    const redis = getRedisClient();
    const acquired = await redis.set("cache:deploy-purge-lock", "1", {
      NX: true,
      EX: 300,
    });

    if (acquired) {
      await purgeCloudflareCache(entries);
      console.log("[Cache] Deploy warmup: cleared Redis + purged CDN list caches");
    }
  } catch (err) {
    console.error("[Cache] Deploy warmup failed:", err.message);
  }
};

module.exports = {
  invalidateListCache,
  clearAllListRedisKeys,
  refreshListCachesOnDeploy,
};
