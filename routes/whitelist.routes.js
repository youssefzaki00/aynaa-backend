const express = require('express');
const router = express.Router();
const {
  addToWhitelist,
  getWhitelist,
  updateWhitelistApp,
  removeFromWhitelist,
} = require('../controllers/whitelistController');
const { authenticateAdmin } = require('../middleware/auth');

// All whitelist routes require admin authentication
router.post('/', authenticateAdmin, addToWhitelist);
router.get('/', authenticateAdmin, getWhitelist);
router.patch('/:id', authenticateAdmin, updateWhitelistApp);
router.delete('/:id', authenticateAdmin, removeFromWhitelist);

module.exports = router;
