const express = require('express');
const router = express.Router();
const {
  createAppController,
  updateAppController,
  deleteAppController,
} = require('../../controllers/appController');
const { protect } = require('../../middleware/auth');
const adminOnly = require('../../middleware/adminOnly');

router.post('/', protect, adminOnly, createAppController);
router.patch('/:id', protect, adminOnly, updateAppController);
router.delete('/:id', protect, adminOnly, deleteAppController);

module.exports = router;
