const express = require("express");
const router = express.Router();
const {
  createExcludedAppController,
  getExcludedAppsController,
  updateExcludedAppController,
  deleteExcludedAppController,
} = require("./excluded-app.controller");
const { protect } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const { edgeCache } = require("../middleware/edgeCache");
const { cacheResponse } = require("../middleware/cache");
const { CACHE_KEYS, CACHE_TTL_SECONDS, LIST_CACHES } = require("../constants/cacheKeys");

/**
 * @swagger
 * /excluded-apps:
 *   post:
 *     tags: [Excluded Apps, Dashboard]
 *     summary: Create excluded app
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [packageName]
 *             properties:
 *               packageName: { type: string, description: "App package name to exclude" }
 *     responses:
 *       201:
 *         description: Excluded app created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Excluded app created successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     excludedApp:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         packageName: { type: string }
 *                         isActive: { type: boolean }
 *                         createdAt: { type: string, format: date-time }
 *                         updatedAt: { type: string, format: date-time }
 *       400: { description: "Validation error" }
 *       401: { description: "Unauthorized" }
 *       403: { description: "Admin access required" }
 *       409: { description: "Excluded app exists" }
 */
router.post("/", protect, adminOnly, createExcludedAppController);

/**
 * @swagger
 * /excluded-apps:
 *   get:
 *     tags: [Excluded Apps, Dashboard]
 *     summary: Get excluded apps
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: lastSync
 *         schema: { type: string, format: date-time }
 *         description: "Get excluded apps modified after timestamp"
 *     responses:
 *       200:
 *         description: Excluded apps retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     excludedApps:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           packageName: { type: string }
 *                           isActive: { type: boolean }
 *                           createdAt: { type: string, format: date-time }
 *                           updatedAt: { type: string, format: date-time }
 *                     deletedIds:
 *                       type: array
 *                       description: "IDs of excluded apps soft-deleted since lastSync (only when lastSync is provided)"
 *                       items: { type: string }
 *       401: { description: "Unauthorized" }
 *       403: { description: "Admin access required" }
 */
router.get(
  "/",
  protect,
  adminOnly,
  edgeCache(undefined, LIST_CACHES.EXCLUDED_APPS.tag),
  cacheResponse(CACHE_KEYS.EXCLUDED_APPS, CACHE_TTL_SECONDS),
  getExcludedAppsController,
);

/**
 * @swagger
 * /excluded-apps/{id}:
 *   patch:
 *     tags: [Excluded Apps, Dashboard]
 *     summary: Update excluded app
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "Excluded app ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageName: { type: string, description: "App package name" }
 *               isActive: { type: boolean, description: "Whether the exclusion is active" }
 *     responses:
 *       200:
 *         description: Excluded app updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Excluded app updated successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     excludedApp:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         packageName: { type: string }
 *                         isActive: { type: boolean }
 *                         createdAt: { type: string, format: date-time }
 *                         updatedAt: { type: string, format: date-time }
 *       400: { description: "Validation error" }
 *       401: { description: "Unauthorized" }
 *       403: { description: "Admin access required" }
 *       404: { description: "Excluded app not found" }
 *       409: { description: "Package name conflict" }
 */
router.patch("/:id", protect, adminOnly, updateExcludedAppController);

/**
 * @swagger
 * /excluded-apps/{id}:
 *   delete:
 *     tags: [Excluded Apps, Dashboard]
 *     summary: Delete excluded app
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "Excluded app ID"
 *     responses:
 *       200:
 *         description: Excluded app deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Excluded app deleted successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedExcludedApp:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         packageName: { type: string }
 *       401: { description: "Unauthorized" }
 *       403: { description: "Admin access required" }
 *       404: { description: "Excluded app not found" }
 */
router.delete("/:id", protect, adminOnly, deleteExcludedAppController);

module.exports = router;