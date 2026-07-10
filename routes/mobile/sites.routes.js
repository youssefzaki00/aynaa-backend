const express = require('express');
const router = express.Router();
const { getSites } = require('../../site/site.controller');
const { protectLight } = require('../../middleware/auth');
const { edgeCache } = require('../../middleware/edgeCache');
const { cacheResponse } = require('../../middleware/cache');
const { CACHE_KEYS, CACHE_TTL_SECONDS, LIST_CACHES } = require('../../constants/cacheKeys');

router.get(
  '/',
  protectLight,
  edgeCache(undefined, LIST_CACHES.SITES.tag),
  cacheResponse(CACHE_KEYS.SITES, CACHE_TTL_SECONDS),
  getSites,
);

module.exports = router;
