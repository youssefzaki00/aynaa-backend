const CACHE_KEYS = {
  KEYWORDS: "global:keywords",
  SITES: "global:sites",
  APPS: "global:apps",
  EXCLUDED_APPS: "global:excluded-apps",
};

const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 3600;

module.exports = { CACHE_KEYS, CACHE_TTL_SECONDS };
