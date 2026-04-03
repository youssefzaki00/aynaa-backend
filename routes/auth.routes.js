const express = require('express');
const router = express.Router();
const { login, getMe, signUpAsUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', signUpAsUser);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
