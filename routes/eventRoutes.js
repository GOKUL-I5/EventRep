const express = require('express');
const { getAllEvents, deleteEvent } = require('../controllers/eventController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getAllEvents); // Public or semi-public
router.delete('/:id', verifyToken, verifyAdmin, deleteEvent); // Admin only

module.exports = router;
