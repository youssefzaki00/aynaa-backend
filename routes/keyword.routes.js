const express = require("express");
const router = express.Router();
const {
  createKeyword,
  getKeywords,
  updateKeyword,
  deleteKeyword,
  toggleKeyword,
} = require("../controllers/keywordController");
const { protect } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

/**
 * @swagger
 * /keywords:
 *   post:
 *     tags: [Keywords, Dashboard]
 *     summary: Create keyword
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [word, categoryId]
 *             properties:
 *               word: { type: string, description: "Keyword to block" }
 *               categoryId: { type: string, description: "Category ID" }
 *     responses:
 *       201:
 *         description: Keyword created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Keyword created successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     keyword: { $ref: '#/components/schemas/Keyword' }
 *       400: { description: "Validation error" }
 *       401: { description: "Unauthorized" }
 *       403: { description: "Admin access required" }
 *       404: { description: "Category not found" }
 *       409: { description: "Keyword exists" }
 */
router.post("/", protect, adminOnly, createKeyword);

/**
 * @swagger
 * /keywords:
 *   get:
 *     tags: [Keywords, Dashboard]
 *     summary: Get keywords
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *         description: "Page number"
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *         description: "Items per page"
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *         description: "Filter by category ID"
 *       - in: query
 *         name: isEnabled
 *         schema: { type: boolean }
 *         description: "Filter by enabled status"
 *       - in: query
 *         name: lastSync
 *         schema: { type: string, format: date-time }
 *         description: "Get keywords modified after timestamp"
 *     responses:
 *       200:
 *         description: Keywords retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     keywords:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Keyword' }
 *                     deletedKeywordIds:
 *                       type: array
 *                       description: "IDs of keywords deleted since lastSync (only when lastSync is provided)"
 *                       items: { type: string }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total: { type: integer }
 *                         pages: { type: integer }
 *       401: { description: "Unauthorized" }
 */
router.get("/", protect, getKeywords);

/**
 * @swagger
 * /keywords/{id}:
 *   patch:
 *     tags: [Keywords, Dashboard]
 *     summary: Update keyword
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "Keyword ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               word: { type: string, description: "Keyword text" }
 *               categoryId: { type: string, description: "Category ID" }
 *     responses:
 *       200:
 *         description: Keyword updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Keyword updated successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     keyword: { $ref: '#/components/schemas/Keyword' }
 *       400: { description: "Validation error" }
 *       401: { description: "Unauthorized" }
 *       403: { description: "Admin access required" }
 *       404: { description: "Keyword/Category not found" }
 */
router.patch("/:id", protect, adminOnly, updateKeyword);

/**
 * @swagger
 * /keywords/{id}:
 *   delete:
 *     tags: [Keywords, Dashboard]
 *     summary: Delete keyword
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "Keyword ID"
 *     responses:
 *       200:
 *         description: Keyword deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Keyword deleted successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedKeyword:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         word: { type: string }
 *       401: { description: "Unauthorized" }
 *       403: { description: "Admin access required" }
 *       404: { description: "Keyword not found" }
 */
router.delete("/:id", protect, adminOnly, deleteKeyword);

/**
 * @swagger
 * /keywords/{id}/toggle:
 *   patch:
 *     tags: [Keywords, Dashboard]
 *     summary: Toggle keyword status
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "Keyword ID"
 *     responses:
 *       200:
 *         description: Keyword status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Keyword status updated successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     keyword: { $ref: '#/components/schemas/Keyword' }
 *       401: { description: "Unauthorized" }
 *       403: { description: "Admin access required" }
 *       404: { description: "Keyword not found" }
 */
router.patch("/:id/toggle", protect, adminOnly, toggleKeyword);

module.exports = router;
