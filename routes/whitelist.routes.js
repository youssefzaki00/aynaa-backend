const express = require('express');
const router = express.Router();
const {
  addToWhitelist,
  getWhitelist,
  updateWhitelistApp,
  removeFromWhitelist,
} = require('../controllers/whitelistController');
const { protect } = require('../middleware/auth');

// All whitelist routes require admin authentication
router.post('/', protect, addToWhitelist);
router.get('/', protect, getWhitelist);
router.patch('/:id', protect, updateWhitelistApp);
router.delete('/:id', protect, removeFromWhitelist);

module.exports = router;
