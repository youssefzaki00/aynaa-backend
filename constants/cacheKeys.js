const { CACHE_TTL_SECONDS, CLOUDFLARE_CDN_HOST } = require("../config/env");

const CACHE_KEYS = {
  KEYWORDS: "global:keywords",
  SITES: "global:sites",
  APPS: "global:apps",
  EXCLUDED_APPS: "global:excluded-apps",
};

const CDN_HOST = CLOUDFLARE_CDN_HOST;

const apiPath = (segment) => `${CDN_HOST}/api/v1/${segment}`;

const LIST_CACHES = {
  KEYWORDS: {
    redis: CACHE_KEYS.KEYWORDS,
    path: "/api/v1/keywords",
    tag: "list-keywords",
    prefix: apiPath("keywords"),
  },
  SITES: {
    redis: CACHE_KEYS.SITES,
    path: "/api/v1/sites",
    tag: "list-sites",
    prefix: apiPath("sites"),
  },
  APPS: {
    redis: CACHE_KEYS.APPS,
    path: "/api/v1/apps",
    tag: "list-apps",
    prefix: apiPath("apps"),
  },
  EXCLUDED_APPS: {
    redis: CACHE_KEYS.EXCLUDED_APPS,
    path: "/api/v1/excluded-apps",
    tag: "list-excluded-apps",
    prefix: apiPath("excluded-apps"),
  },
};

module.exports = {
  CACHE_KEYS,
  LIST_CACHES,
  CACHE_TTL_SECONDS,
  CDN_HOST,
};
