const express = require('express');
const router = express.Router();
const {
  createExcludedAppController,
  updateExcludedAppController,
  deleteExcludedAppController,
} = require('../../keywords-blocking-excluded-app/excluded-app.controller');
const { protect } = require('../../middleware/auth');
const adminOnly = require('../../middleware/adminOnly');

router.post('/', protect, adminOnly, createExcludedAppController);
router.patch('/:id', protect, adminOnly, updateExcludedAppController);
router.delete('/:id', protect, adminOnly, deleteExcludedAppController);

module.exports = router;
