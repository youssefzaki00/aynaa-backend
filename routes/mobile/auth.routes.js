const express = require('express');
const router = express.Router();
const { loginUser, getMe, signUpAsUser } = require('../../auth/auth.controller');
const { protect } = require('../../middleware/auth');

router.post('/signup', signUpAsUser);
router.post('/user/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;
