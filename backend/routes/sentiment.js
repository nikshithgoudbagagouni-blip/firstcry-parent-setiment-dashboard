const express = require('express');
const router = express.Router();
const sentimentController = require('../controllers/sentimentController');

// POST /api/sentiment/process
router.post('/process', sentimentController.processText);

module.exports = router;
