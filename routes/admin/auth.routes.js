const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../../auth/auth.controller');

router.post('/admin/login', loginAdmin);

module.exports = router;
