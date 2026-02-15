const express = require('express');
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategory,
} = require('../controllers/categoryController');
const { authenticateAdmin } = require('../middleware/auth');

// All category routes require admin authentication
router.post('/', authenticateAdmin, createCategory);
router.get('/', authenticateAdmin, getCategories);
router.get('/:id', authenticateAdmin, getCategoryById);
router.patch('/:id', authenticateAdmin, updateCategory);
router.delete('/:id', authenticateAdmin, deleteCategory);
router.patch('/:id/toggle', authenticateAdmin, toggleCategory);

module.exports = router;
