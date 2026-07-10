const express = require('express');
const router = express.Router();
const {
  createKeyword,
  updateKeyword,
  deleteKeyword,
  toggleKeyword,
} = require('../../controllers/keywordController');
const { protect } = require('../../middleware/auth');
const adminOnly = require('../../middleware/adminOnly');

router.post('/', protect, adminOnly, createKeyword);
router.patch('/:id', protect, adminOnly, updateKeyword);
router.delete('/:id', protect, adminOnly, deleteKeyword);
router.patch('/:id/toggle', protect, adminOnly, toggleKeyword);

module.exports = router;
