const express = require('express');
const router = express.Router();
const { apiCacheHeaders } = require('../middleware/apiCacheHeaders');

router.use(apiCacheHeaders);

// Mobile (JWT)
router.use('/auth', require('./mobile/auth.routes'));
router.use('/keywords', require('./mobile/keywords.routes'));
router.use('/sites', require('./mobile/sites.routes'));
router.use('/apps', require('./mobile/apps.routes'));
router.use('/excluded-apps', require('./mobile/excluded-apps.routes'));
router.use('/requests', require('./mobile/requests.routes'));

// Admin dashboard (JWT)
router.use('/auth', require('./admin/auth.routes'));
router.use('/admin/categories', require('./admin/categories.routes'));
router.use('/keywords', require('./admin/keywords.routes'));
router.use('/sites', require('./admin/sites.routes'));
router.use('/apps', require('./admin/apps.routes'));
router.use('/excluded-apps', require('./admin/excluded-apps.routes'));

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'aynaa API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
