const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard
router.get('/', dashboardController.getDashboardSummary);

module.exports = router;
