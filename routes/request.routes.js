const express = require("express");
const router = express.Router();
const {
  postRequestController,
  getRequestsController,
  updateRequestController,
  deleteRequestController,
} = require("../controllers/requestController");
const { protect } = require("../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     Request:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Request ID
 *           example: "507f1f77bcf86cd799439011"
 *         userId:
 *           type: string
 *           description: User ID who created the request
 *           example: "507f1f77bcf86cd799439012"
 *         type:
 *           type: string
 *           enum: [UNINSTALL]
 *           description: Type of request
 *           example: "UNINSTALL"
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, DECLINED, REJECTED]
 *           description: Current status of the request
 *           default: "PENDING"
 *           example: "PENDING"
 *         message:
 *           type: string
 *           description: Additional message or reason (max 500 chars)
 *           example: "Please uninstall this app"
 *         details:
 *           type: object
 *           description: Additional details about the request
 *           example: { "packageName": "com.example.app", "reason": "inappropriate" }
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     RequestResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         type:
 *           type: string
 *         status:
 *           type: string
 *         message:
 *           type: string
 *         details:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         total:
 *           type: integer
 *           example: 100
 *         pages:
 *           type: integer
 *           example: 5
 *
 * /requests:
 *   post:
 *     tags:
 *       - Requests
 *     summary: Create a new request
 *     description: Authenticated users can create requests (e.g., app uninstall requests). The userId is automatically set from the authenticated user token.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [UNINSTALL]
 *                 description: Type of request
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, DECLINED, REJECTED]
 *                 description: Initial status (defaults to PENDING if not provided)
 *               message:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional message or reason
 *               details:
 *                 type: object
 *                 description: Optional additional details
 *           example:
 *             type: "UNINSTALL"
 *             message: "Please uninstall this app"
 *             details: { "packageName": "com.example.app" }
 *     responses:
 *       201:
 *         description: Request created successfully
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
 *                     request:
 *                       $ref: '#/components/schemas/RequestResponse'
 *       400:
 *         description: Missing required fields or invalid data
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       500:
 *         description: Server error
 *
 *   get:
 *     tags:
 *       - Requests
 *       - Dashboard
 *     summary: Get user requests with pagination
 *     description: Retrieve requests with optional filtering by type and pagination. Users can only view their own requests unless they are admins accessing with userId query parameter.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [UNINSTALL]
 *         description: Filter by request type
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by userId (only accessible by admins or the user themselves)
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page (max 100)
 *     responses:
 *       200:
 *         description: Requests retrieved successfully
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
 *                     requests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RequestResponse'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - user cannot access another user's requests
 *       500:
 *         description: Server error
 *
 * /requests/{id}:
 *   patch:
 *     tags:
 *       - Requests
 *       - Dashboard
 *     summary: Update a request
 *     description: Update a request. Users can only update their own requests. Admin users can update any request.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, DECLINED, REJECTED]
 *               message:
 *                 type: string
 *                 maxLength: 500
 *               details:
 *                 type: object
 *           example:
 *             status: "APPROVED"
 *             message: "Request approved"
 *     responses:
 *       200:
 *         description: Request updated successfully
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
 *                     request:
 *                       $ref: '#/components/schemas/RequestResponse'
 *       400:
 *         description: No valid fields to update or invalid status
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - user cannot update another user's request
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     tags:
 *       - Requests
 *     summary: Delete a request
 *     description: Delete a request. Users can only delete their own requests. Admin users can delete any request.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - user cannot delete another user's request
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */

router.post("/", protect, postRequestController);

router.get("/", protect, getRequestsController);

router.patch("/:id", protect, updateRequestController);

router.delete("/:id", protect, deleteRequestController);

module.exports = router;
