const express = require('express');
const router = express.Router();
const {
  createKeyword,
  getKeywords,
  updateKeyword,
  deleteKeyword,
  toggleKeyword,
} = require('../controllers/keywordController');
const { authenticateAdmin } = require('../middleware/auth');

// All keyword routes require admin authentication
router.post('/', authenticateAdmin, createKeyword);
router.get('/', authenticateAdmin, getKeywords);
router.patch('/:id', authenticateAdmin, updateKeyword);
router.delete('/:id', authenticateAdmin, deleteKeyword);
router.patch('/:id/toggle', authenticateAdmin, toggleKeyword);

module.exports = router;
