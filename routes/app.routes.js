const express = require('express');
const router = express.Router();
const {
  createAppController,
  getAppsController,
  updateAppController,
  deleteAppController,
} = require('../controllers/appController');
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

/**
 * POST /apps (admin)
 */
router.post('/', protect, adminOnly, createAppController);

/**
 * GET /apps?lastSync
 */
router.get('/', protect, getAppsController);

/**
 * PATCH /apps/:id (admin)
 */
router.patch('/:id', protect, adminOnly, updateAppController);

/**
 * DELETE /apps/:id (admin)
 */
router.delete('/:id', protect, adminOnly, deleteAppController);

module.exports = router;
