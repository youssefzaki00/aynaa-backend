const express = require("express");
const router = express.Router();
const { loginUser, loginAdmin, getMe, signUpAsUser } = require("../auth/auth.controller");
const { protect } = require("../middleware/auth");

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Authentication]
 *     summary: Register user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceId]
 *             properties:
 *               deviceId: { type: string, description: "Device identifier" }
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User created successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     token: { type: string, description: "JWT token" }
 *       400: { description: "Validation error" }
 *       409: { description: "User exists" }
 */
router.post("/signup", signUpAsUser);

/**
 * @swagger
 * /auth/user/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceId]
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: Device identifier
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Login successful" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     token: { type: string, description: "JWT token" }
 *       400: { description: "Validation error" }
 *       401: { description: "Invalid credentials" }
 */
router.post("/user/login", loginUser);

/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     tags: [Authentication, Dashboard]
 *     summary: Login admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 description: Admin username
 *               password:
 *                 type: string
 *                 description: Admin password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Login successful" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     admin: { $ref: '#/components/schemas/User' }
 *                     token: { type: string, description: "JWT token" }
 *       400: { description: "Validation error" }
 *       401: { description: "Invalid credentials" }
 */
router.post("/admin/login", loginAdmin);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/User' }
 *       401: { description: "Unauthorized" }
 *       404: { description: "User not found" }
 */
router.get("/me", protect, getMe);

module.exports = router;
