const express = require('express');
const router = express.Router();
const {
  submitCustomizationRequest,
  getCustomizationStatus,
  getAllCustomizationRequests,
  reviewCustomizationRequest,
} = require('../controllers/customizationController');
const { authenticateAPI, authenticateAdmin } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

// Client routes
router.post('/request', authenticateAPI, strictLimiter, submitCustomizationRequest);
router.get('/status', authenticateAPI, getCustomizationStatus);

// Admin routes
router.get('/admin/requests', authenticateAdmin, getAllCustomizationRequests);
router.patch('/admin/review/:id', authenticateAdmin, reviewCustomizationRequest);

module.exports = router;
