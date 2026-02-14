const express = require('express');
const router = express.Router();
const { syncDevice } = require('../controllers/deviceController');
const { authenticateAPI } = require('../middleware/auth');

// GET /api/v1/sync
router.get('/sync', authenticateAPI, syncDevice);

module.exports = router;
