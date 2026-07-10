const express = require('express');
const router = express.Router();
const { getKeywords } = require('../../controllers/keywordController');
const { protectLight } = require('../../middleware/auth');
const { edgeCache } = require('../../middleware/edgeCache');
const { cacheResponse } = require('../../middleware/cache');
const { CACHE_KEYS, CACHE_TTL_SECONDS, LIST_CACHES } = require('../../constants/cacheKeys');

router.get(
  '/',
  protectLight,
  edgeCache(undefined, LIST_CACHES.KEYWORDS.tag),
  cacheResponse(CACHE_KEYS.KEYWORDS, CACHE_TTL_SECONDS),
  getKeywords,
);

module.exports = router;
