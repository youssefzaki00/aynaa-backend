const { getRedisClient } = require("../config/redis");

const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECONDS) || 300;

const isCacheEnabled = () =>
  process.env.NODE_ENV !== "test" && Boolean(process.env.REDIS_URL);

const buildCacheKey = (namespace, params = {}) => {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return `cache:${namespace}:${sorted || "all"}`;
};

const getCache = async (key) => {
  if (!isCacheEnabled()) return null;

  const redis = getRedisClient();
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

const setCache = async (key, value, ttlSeconds = DEFAULT_TTL) => {
  if (!isCacheEnabled()) return;

  const redis = getRedisClient();
  await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
};

const invalidateNamespace = async (namespace) => {
  if (!isCacheEnabled()) return;

  const redis = getRedisClient();
  const pattern = `cache:${namespace}:*`;

  for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    await redis.del(key);
  }
};

module.exports = {
  buildCacheKey,
  getCache,
  setCache,
  invalidateNamespace,
};
