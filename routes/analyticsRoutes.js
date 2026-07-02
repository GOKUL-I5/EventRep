const express = require('express');
const { getAdminAnalytics } = require('../controllers/analyticsController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/analytics/dashboard
router.get('/dashboard', verifyToken, verifyAdmin, getAdminAnalytics);

module.exports = router;
