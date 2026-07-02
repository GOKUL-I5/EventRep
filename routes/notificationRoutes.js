const express = require('express');
const { sendNotification } = require('../controllers/notificationController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// POST /api/notifications/send (Admin Only)
router.post('/send', verifyToken, verifyAdmin, sendNotification);

module.exports = router;
