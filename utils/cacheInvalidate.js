const { LIST_CACHES } = require("../constants/cacheKeys");
const { purgeCloudflareCache } = require("./purgeCloudflareCache");

/**
 * Purge Cloudflare CDN cache for one or more list resources.
 * Call after create, update, delete, toggle, or bulk import.
 * @param {...string} names - LIST_CACHES keys, e.g. 'KEYWORDS', 'SITES'
 */
const invalidateListCache = async (...names) => {
  const entries = names.map((name) => LIST_CACHES[name]).filter(Boolean);
  if (!entries.length) {
    return;
  }

  await purgeCloudflareCache(entries);
};

/**
 * Purge all list CDN caches. Used on deploy to drop any stale edge copies.
 */
const refreshListCachesOnDeploy = async () => {
  const entries = Object.values(LIST_CACHES);
  await purgeCloudflareCache(entries);
  console.log("[Cache] Deploy warmup: purged CDN list caches");
};

module.exports = {
  invalidateListCache,
  refreshListCachesOnDeploy,
};
