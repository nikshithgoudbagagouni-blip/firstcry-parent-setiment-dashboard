const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// GET /api/report
router.get('/', reportController.exportReport);

module.exports = router;
