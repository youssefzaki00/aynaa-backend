const express = require('express');
const router = express.Router();
const {
  createSite,
  getSites,
  updateSite,
  deleteSite,
} = require('../controllers/siteController');
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.get('/', protect, getSites); // all authenticated users: users only get active site due to controller logic
router.post('/', protect, adminOnly, createSite);
router.patch('/:id', protect, adminOnly, updateSite);
router.delete('/:id', protect, adminOnly, deleteSite);

module.exports = router;
