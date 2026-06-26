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
 * POST /requests
 */
router.post("/", protect, postRequestController);

/**
 * GET /requests?type&userId
 */
router.get("/", protect, getRequestsController);

/**
 * PATCH /requests/:id
 */
router.patch("/:id", protect, updateRequestController);

/**
 * DELETE /requests/:id
 */
router.delete("/:id", protect, deleteRequestController);

module.exports = router;
