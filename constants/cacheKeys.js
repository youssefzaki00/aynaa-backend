const CACHE_KEYS = {
  KEYWORDS: "global:keywords",
  SITES: "global:sites",
  APPS: "global:apps",
  EXCLUDED_APPS: "global:excluded-apps",
};

const LIST_CACHES = {
  KEYWORDS: { redis: CACHE_KEYS.KEYWORDS, path: "/api/v1/keywords" },
  SITES: { redis: CACHE_KEYS.SITES, path: "/api/v1/sites" },
  APPS: { redis: CACHE_KEYS.APPS, path: "/api/v1/apps" },
  EXCLUDED_APPS: {
    redis: CACHE_KEYS.EXCLUDED_APPS,
    path: "/api/v1/excluded-apps",
  },
};

const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 3600;
const CDN_CACHE_MAX_AGE = Number(process.env.CDN_CACHE_MAX_AGE) || 31536000;

module.exports = {
  CACHE_KEYS,
  LIST_CACHES,
  CACHE_TTL_SECONDS,
  CDN_CACHE_MAX_AGE,
};
