const { ensureRedisClient } = require("../config/redis");

const KEY_PREFIX = "aynna";
const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECONDS) || 300;

const isCacheEnabled = () =>
  process.env.NODE_ENV !== "test" && Boolean(process.env.REDIS_URL);

const buildCacheKey = (namespace, params = {}) => {
  const activeParams = Object.entries(params).filter(
    ([, value]) => value !== "" && value !== undefined && value !== null
  );

  if (activeParams.length === 0) {
    return `${KEY_PREFIX}:${namespace}`;
  }

  const sorted = activeParams
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return `${KEY_PREFIX}:${namespace}:${sorted}`;
};

const getCache = async (key) => {
  if (!isCacheEnabled()) return null;

  try {
    const redis = await ensureRedisClient();
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Cache get failed [${key}]:`, error.message);
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = DEFAULT_TTL) => {
  if (!isCacheEnabled()) return;

  const redis = await ensureRedisClient();
  await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
};

// Prevents cache stampede: only one request populates Redis while others wait.
const getOrSetCache = async (key, fetchFn, ttlSeconds = DEFAULT_TTL) => {
  const cached = await getCache(key);
  if (cached) return { data: cached, hit: true };

  if (!isCacheEnabled()) {
    return { data: await fetchFn(), hit: false };
  }

  const redis = await ensureRedisClient();
  const lockKey = `${key}:lock`;
  const acquired = await redis.set(lockKey, "1", { NX: true, EX: 30 });

  if (!acquired) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      const retry = await getCache(key);
      if (retry) return { data: retry, hit: true };
    }
  }

  try {
    const cachedAfterLock = await getCache(key);
    if (cachedAfterLock) return { data: cachedAfterLock, hit: true };

    const data = await fetchFn();
    await setCache(key, data, ttlSeconds);
    return { data, hit: false };
  } finally {
    await redis.del(lockKey).catch(() => {});
  }
};

const invalidateNamespace = async (namespace) => {
  if (!isCacheEnabled()) return;

  try {
    const redis = await ensureRedisClient();
    const pattern = `${KEY_PREFIX}:${namespace}*`;

    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      await redis.del(key);
    }
  } catch (error) {
    console.error(`Cache invalidate failed [${namespace}]:`, error.message);
  }
};

module.exports = {
  buildCacheKey,
  getCache,
  setCache,
  getOrSetCache,
  invalidateNamespace,
};
