const express = require('express');
const router = express.Router();
const {
  submitCustomizationRequest,
  getCustomizationStatus,
  getAllCustomizationRequests,
  reviewCustomizationRequest,
} = require('../controllers/customizationController');
const { authenticateAPI, protect } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

// Client routes
router.post('/request', authenticateAPI, strictLimiter, submitCustomizationRequest);
router.get('/status', authenticateAPI, getCustomizationStatus);

// Admin routes
router.get('/admin/requests', protect, getAllCustomizationRequests);
router.patch('/admin/review/:id', protect, reviewCustomizationRequest);

module.exports = router;
