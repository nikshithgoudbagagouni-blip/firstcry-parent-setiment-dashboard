const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET /api/analytics/trends
router.get('/trends', analyticsController.getTrends);

module.exports = router;
