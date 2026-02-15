const express = require('express');
const router = express.Router();
const {
  createKeyword,
  getKeywords,
  updateKeyword,
  deleteKeyword,
  toggleKeyword,
} = require('../controllers/keywordController');
const { protect } = require('../middleware/auth');

// All keyword routes require admin authentication
router.post('/', protect, createKeyword);
router.get('/', protect, getKeywords);
router.patch('/:id', protect, updateKeyword);
router.delete('/:id', protect, deleteKeyword);
router.patch('/:id/toggle', protect, toggleKeyword);

module.exports = router;
