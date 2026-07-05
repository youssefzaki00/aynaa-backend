const CACHE_KEYS = {
  KEYWORDS: "global:keywords",
  SITES: "global:sites",
  APPS: "global:apps",
  EXCLUDED_APPS: "global:excluded-apps",
};

const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 3600;
const CDN_CACHE_MAX_AGE = Number(process.env.CDN_CACHE_MAX_AGE) || 31536000;

module.exports = { CACHE_KEYS, CACHE_TTL_SECONDS, CDN_CACHE_MAX_AGE };
