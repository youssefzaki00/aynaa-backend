const express = require('express');
const router = express.Router();
const { getDeviceConfig } = require('../controllers/deviceController');
const { authenticateAPI } = require('../middleware/auth');

// GET /api/v1/config
router.get('/config', authenticateAPI, getDeviceConfig);

module.exports = router;
