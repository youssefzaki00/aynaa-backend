const express = require('express');
const router = express.Router();
const { getAppsController } = require('../../controllers/appController');
const { protectLight } = require('../../middleware/auth');
const { edgeCache } = require('../../middleware/edgeCache');
const { cacheResponse } = require('../../middleware/cache');
const { CACHE_KEYS, CACHE_TTL_SECONDS, LIST_CACHES } = require('../../constants/cacheKeys');

router.get(
  '/',
  protectLight,
  edgeCache(undefined, LIST_CACHES.APPS.tag),
  cacheResponse(CACHE_KEYS.APPS, CACHE_TTL_SECONDS),
  getAppsController,
);

module.exports = router;
