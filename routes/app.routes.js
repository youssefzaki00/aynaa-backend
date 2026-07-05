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
const stripVaryHeader = require('../middleware/stripVary');

/**
 * @swagger
 * components:
 *   schemas:
 *     App:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Application ID
 *           example: "507f1f77bcf86cd799439011"
 *         packageName:
 *           type: string
 *           description: Android package name (unique identifier)
 *           example: "com.example.myapp"
 *         isDeleted:
 *           type: boolean
 *           description: Soft delete flag
 *           default: false
 *           example: false
 *         isActive:
 *           type: boolean
 *           description: Whether the app is actively monitored or filtered
 *           default: true
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     AppResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         packageName:
 *           type: string
 *         isDeleted:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 * tags:
 *   - name: Apps
 *     description: Application management endpoints
 *   - name: Dashboard
 *     description: Admin dashboard endpoints for managing apps and system configuration
 *
 * /apps:
 *   post:
 *     tags:
 *       - Dashboard
 *       - Apps
 *     summary: Create a new app entry (Admin only)
 *     description: Create a new monitored application entry. Package name must be unique. Only admins can create apps.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packageName
 *             properties:
 *               packageName:
 *                 type: string
 *                 maxLength: 200
 *                 description: Android package name (must be unique)
 *                 example: "com.example.myapp"
 *           example:
 *             packageName: "com.instagram.android"
 *     responses:
 *       201:
 *         description: App created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     app:
 *                       $ref: '#/components/schemas/AppResponse'
 *       400:
 *         description: Missing packageName field
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - admin access required
 *       409:
 *         description: Conflict - app with this package name already exists
 *       500:
 *         description: Server error
 *
 *   get:
 *     tags:
 *       - Dashboard
 *       - Apps
 *     summary: Get all apps
 *     description: Retrieve all monitored applications with optional filtering by sync time. Users and admins can access this endpoint.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: lastSync
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO 8601 timestamp. Returns only apps created or updated after this time. Useful for syncing app lists on devices.
 *         example: "2026-06-25T10:30:00Z"
 *     responses:
 *       200:
 *         description: Apps retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     apps:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AppResponse'
 *                     deletedIds:
 *                       type: array
 *                       description: "IDs of apps soft-deleted since lastSync (only when lastSync is provided)"
 *                       items: { type: string }
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       500:
 *         description: Server error
 *
 * /apps/{id}:
 *   patch:
 *     tags:
 *       - Dashboard
 *       - Apps
 *     summary: Update an app (Admin only)
 *     description: Update app properties like packageName, isDeleted, or isActive status. Only admins can update apps.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: App ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageName:
 *                 type: string
 *                 maxLength: 200
 *                 description: New package name (must be unique)
 *               isDeleted:
 *                 type: boolean
 *                 description: Mark app as deleted (soft delete)
 *               isActive:
 *                 type: boolean
 *                 description: Enable or disable app monitoring
 *           example:
 *             isActive: false
 *             packageName: "com.example.updated"
 *     responses:
 *       200:
 *         description: App updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     app:
 *                       $ref: '#/components/schemas/AppResponse'
 *       400:
 *         description: No valid fields to update or invalid data
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: App not found
 *       409:
 *         description: Conflict - new package name already exists
 *       500:
 *         description: Server error
 *
 *   delete:
 *     tags:
 *       - Dashboard
 *       - Apps
 *     summary: Delete an app (Admin only)
 *     description: Permanently delete an app entry from the system. Only admins can delete apps.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: App ID to delete
 *     responses:
 *       200:
 *         description: App deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedApp:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         packageName:
 *                           type: string
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: App not found
 *       500:
 *         description: Server error
 */

router.post('/', protect, adminOnly, createAppController);

router.get('/', protect, stripVaryHeader, getAppsController);

router.patch('/:id', protect, adminOnly, updateAppController);

router.delete('/:id', protect, adminOnly, deleteAppController);

module.exports = router;
