const express = require('express');
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);

module.exports = router;
