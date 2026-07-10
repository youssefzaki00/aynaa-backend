const express = require('express');
const router = express.Router();
const {
  createSite,
  updateSite,
  deleteSite,
  uploadSitesFile,
} = require('../../site/site.controller');
const { protect } = require('../../middleware/auth');
const adminOnly = require('../../middleware/adminOnly');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post('/', protect, adminOnly, createSite);
router.post('/upload', protect, adminOnly, upload.single('file'), uploadSitesFile);
router.patch('/:id', protect, adminOnly, updateSite);
router.delete('/:id', protect, adminOnly, deleteSite);

module.exports = router;
