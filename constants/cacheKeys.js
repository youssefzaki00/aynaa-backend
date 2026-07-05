const { CDN_CACHE_MAX_AGE, CLOUDFLARE_CDN_HOST } = require("../config/env");

const CDN_HOST = CLOUDFLARE_CDN_HOST;

const apiPath = (segment) => `${CDN_HOST}/api/v1/${segment}`;

const LIST_CACHES = {
  KEYWORDS: {
    path: "/api/v1/keywords",
    tag: "list-keywords",
    prefix: apiPath("keywords"),
  },
  SITES: {
    path: "/api/v1/sites",
    tag: "list-sites",
    prefix: apiPath("sites"),
  },
  APPS: {
    path: "/api/v1/apps",
    tag: "list-apps",
    prefix: apiPath("apps"),
  },
  EXCLUDED_APPS: {
    path: "/api/v1/excluded-apps",
    tag: "list-excluded-apps",
    prefix: apiPath("excluded-apps"),
  },
};

module.exports = {
  LIST_CACHES,
  CDN_CACHE_MAX_AGE,
  CDN_HOST,
};
