const express = require("express");
const router = express.Router();
const {
  createSite,
  getSites,
  updateSite,
  deleteSite,
  uploadSitesFile,
} = require("./site.controller");
const { protect, protectLight } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const { cacheResponse } = require("../middleware/cache");
const { CACHE_KEYS, CACHE_TTL_SECONDS } = require("../constants/cacheKeys");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * /sites:
 *   get:
 *     tags: [Sites, Dashboard]
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
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: "Filter by active/enabled status"
 *       - in: query
 *         name: lastSync
 *         schema: { type: string, format: date-time }
 *         description: "Get sites created or updated after timestamp"
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
 *                   type: object
 *                   properties:
 *                     sites:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Site' }
 *                     deletedSiteIds:
 *                       type: array
 *                       description: "IDs of sites soft-deleted since lastSync (only when lastSync is provided)"
 *                       items: { type: string }
 *                     pagination:
 *                       type: object
 *       401: { description: "Unauthorized" }
 */
router.get("/", protectLight, cacheResponse(CACHE_KEYS.SITES, CACHE_TTL_SECONDS), getSites);

/**
 * @swagger
 * /sites:
 *   post:
 *     tags: [Sites, Dashboard]
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
 *               isActive: { type: boolean, default: true, description: "Whether site blocking is enabled" }
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
router.post("/", protect, adminOnly, createSite);

/**
 * @swagger
 * /sites/{id}:
 *   patch:
 *     tags: [Sites, Dashboard]
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
 *               isActive: { type: boolean, description: "Whether site blocking is enabled" }
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
router.patch("/:id", protect, adminOnly, updateSite);

/**
 * @swagger
 * /sites/{id}:
 *   delete:
 *     tags: [Sites, Dashboard]
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
router.delete("/:id", protect, adminOnly, deleteSite);

/**
 * @swagger
 * /sites/upload:
 *   post:
 *     tags: [Sites, Dashboard]
 *     summary: Upload a text file of blocked sites for bulk import
 *     description: |
 *       Upload a plain text file containing host entries in the format `0.0.0.0 example.com`.
 *       Each valid line is parsed, converted into a site document, and inserted in batches.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, categoryId]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "Text file with one blocked site entry per line"
 *               categoryId:
 *                 type: string
 *                 description: "Category ID to assign to all imported sites"
 *     responses:
 *       200:
 *         description: Sites seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Sites is seeded successfully" }
 *       400: { description: "Bad request or validation error" }
 *       404: { description: "Category not found" }
 *       500: { description: "Internal server error" }
 */
router.post(
  "/upload",
  protect,
  adminOnly,
  upload.single("file"),
  uploadSitesFile,
);

module.exports = router;
