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

/**
 * @swagger
 * /sites:
 *   get:
 *     tags: [Sites]
 *     summary: Get sites
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
 *         name: search
 *         schema: { type: string }
 *         description: "Search term for site name or URL"
 *     responses:
 *       200:
 *         description: Sites retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Site' }
 *       401: { description: "Unauthorized" }
 */
router.get('/', protect, getSites);

/**
 * @swagger
 * /sites:
 *   post:
 *     tags: [Sites]
 *     summary: Create site
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, url]
 *             properties:
 *               name: { type: string, description: "Site name" }
 *               url: { type: string, format: uri, description: "Site URL" }
 *               category: { type: string, enum: [PORN, GAMBLING, ATHEISM, VIOLENCE, OTHER], description: "Site category" }
 *               isBlocked: { type: boolean, default: true, description: "Whether site is blocked" }
 *     responses:
 *       201:
 *         description: Site created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Site created successfully" }
 *                 data: { $ref: '#/components/schemas/Site' }
 *       400: { description: "Validation error" }
 *       401: { description: "Unauthorized" }
 *       403: { description: "Admin access required" }
 *       409: { description: "Site exists" }
 */
router.post('/', protect, adminOnly, createSite);

/**
 * @swagger
 * /sites/{id}:
 *   patch:
 *     tags: [Sites]
 *     summary: Update site
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "Site ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: "Site name" }
 *               url: { type: string, format: uri, description: "Site URL" }
 *               category: { type: string, enum: [PORN, GAMBLING, ATHEISM, VIOLENCE, OTHER], description: "Site category" }
 *               isBlocked: { type: boolean, description: "Whether site is blocked" }
 *     responses:
 *       200:
 *         description: Site updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Site updated successfully" }
 *                 data: { $ref: '#/components/schemas/Site' }
 *       400: { description: "Validation error" }
 *       401: { description: "Unauthorized" }
 *       403: { description: "Admin access required" }
 *       404: { description: "Site not found" }
 */
router.patch('/:id', protect, adminOnly, updateSite);

/**
 * @swagger
 * /sites/{id}:
 *   delete:
 *     tags: [Sites]
 *     summary: Delete site
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "Site ID"
 *     responses:
 *       200:
 *         description: Site deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Site deleted successfully" }
 *       401: { description: "Unauthorized" }
 *       403: { description: "Admin access required" }
 *       404: { description: "Site not found" }
 */
router.delete('/:id', protect, adminOnly, deleteSite);

module.exports = router;
