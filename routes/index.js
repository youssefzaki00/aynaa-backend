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
const authRoutes = require('./auth.routes');

// Mount routes
router.use('/', deviceRoutes);
router.use('/uninstall', uninstallRoutes);
router.use('/suggestions', suggestionRoutes);
router.use('/customization', customizationRoutes);
router.use('/admin/categories', categoryRoutes);
router.use('/keywords', keywordRoutes);
router.use('/admin/whitelist', whitelistRoutes);
router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'wekayaa API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
