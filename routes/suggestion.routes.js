const express = require('express');
const router = express.Router();
const {
  submitSuggestion,
  getAllSuggestions,
  reviewSuggestion,
} = require('../controllers/suggestionController');
const { authenticateAPI, protect } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

// Client route
router.post('/', authenticateAPI, strictLimiter, submitSuggestion);

// Admin routes
router.get('/admin', protect, getAllSuggestions);
router.patch('/admin/review/:id', protect, reviewSuggestion);

module.exports = router;
