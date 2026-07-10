const express = require('express');
const router = express.Router();
const { getExcludedAppsController } = require('../../keywords-blocking-excluded-app/excluded-app.controller');
const { protectLight } = require('../../middleware/auth');
const { edgeCache } = require('../../middleware/edgeCache');
const { cacheResponse } = require('../../middleware/cache');
const { CACHE_KEYS, CACHE_TTL_SECONDS, LIST_CACHES } = require('../../constants/cacheKeys');

router.get(
  '/',
  protectLight,
  edgeCache(undefined, LIST_CACHES.EXCLUDED_APPS.tag),
  cacheResponse(CACHE_KEYS.EXCLUDED_APPS, CACHE_TTL_SECONDS),
  getExcludedAppsController,
);

module.exports = router;
