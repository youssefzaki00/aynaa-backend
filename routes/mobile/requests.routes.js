const express = require('express');
const router = express.Router();
const {
  postRequestController,
  getRequestsController,
  updateRequestController,
  deleteRequestController,
} = require('../../controllers/requestController');
const { protect } = require('../../middleware/auth');

router.post('/', protect, postRequestController);
router.get('/', protect, getRequestsController);
router.patch('/:id', protect, updateRequestController);
router.delete('/:id', protect, deleteRequestController);

module.exports = router;
