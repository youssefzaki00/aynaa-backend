const express = require('express');
const router = express.Router();

// Import route modules
const deviceRoutes = require('./device.routes');
const uninstallRoutes = require('./uninstall.routes');
const suggestionRoutes = require('./suggestion.routes');
const keywordRoutes = require('./keyword.routes');
const whitelistRoutes = require('./whitelist.routes');
const customizationRoutes = require('./customization.routes');
const categoryRoutes = require('./category.routes');
const siteRoutes = require('../site/site.routes');
const authRoutes = require('./auth.routes');
const excludedAppRoutes = require('../keywords-blocking-excluded-app/excluded-app.routes');
const appsRoutes = require('./app.routes');
const requestsRoutes = require('./request.routes');
const { protect } = require('../middleware/auth');
const { deleteRequestController } = require('../controllers/requestController');

// Mount routes
router.use('/', deviceRoutes);
router.use('/uninstall', uninstallRoutes);
router.use('/suggestions', suggestionRoutes);
router.use('/customization', customizationRoutes);
router.use('/admin/categories', categoryRoutes);
router.use('/keywords', keywordRoutes);
router.use('/sites', siteRoutes);
router.use('/admin/whitelist', whitelistRoutes);
router.use('/auth', authRoutes);
router.use('/excluded-apps', excludedAppRoutes);
router.use('/apps', appsRoutes);
router.use('/requests', requestsRoutes);
router.delete('/request/:id', protect, deleteRequestController);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'aynaa API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
