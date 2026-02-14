const express = require('express');
const router = express.Router();
const {
  submitUninstallRequest,
  checkUninstallStatus,
  getAllUninstallRequests,
  reviewUninstallRequest,
} = require('../controllers/uninstallController');
const { authenticateAPI, authenticateAdmin } = require('../middleware/auth');
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
router.get('/admin/requests', authenticateAdmin, getAllUninstallRequests);
router.patch('/admin/review/:id', authenticateAdmin, reviewUninstallRequest);

module.exports = router;
