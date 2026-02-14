const express = require('express');
const router = express.Router();
const {
  submitSuggestion,
  getAllSuggestions,
  reviewSuggestion,
} = require('../controllers/suggestionController');
const { authenticateAPI, authenticateAdmin } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

// Client route
router.post('/', authenticateAPI, strictLimiter, submitSuggestion);

// Admin routes
router.get('/admin', authenticateAdmin, getAllSuggestions);
router.patch('/admin/review/:id', authenticateAdmin, reviewSuggestion);

module.exports = router;
