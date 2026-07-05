const { getRedisClient, isRedisReady } = require("../config/redis");

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

module.exports = { invalidateCache };
