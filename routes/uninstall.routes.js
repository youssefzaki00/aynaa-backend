const express = require('express');
const router = express.Router();
const {
  submitUninstallRequest,
  checkUninstallStatus,
  getAllUninstallRequests,
  reviewUninstallRequest,
} = require('../controllers/uninstallController');
const { authenticateAPI, protect } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

// Client routes
router.post(
  '/request',
  authenticateAPI,
  strictLimiter,
  upload.array('images', 5), // Max 5 images
  submitUninstallRequest
);

router.get('/status', authenticateAPI, checkUninstallStatus);

// Admin routes
router.get('/admin/requests', protect, getAllUninstallRequests);
router.patch('/admin/review/:id', protect, reviewUninstallRequest);

module.exports = router;
