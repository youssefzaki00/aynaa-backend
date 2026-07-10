const express = require('express');
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategory,
} = require('../../controllers/categoryController');
const { protect } = require('../../middleware/auth');

router.post('/', protect, createCategory);
router.get('/', protect, getCategories);
router.get('/:id', protect, getCategoryById);
router.patch('/:id', protect, updateCategory);
router.delete('/:id', protect, deleteCategory);
router.patch('/:id/toggle', protect, toggleCategory);

module.exports = router;
