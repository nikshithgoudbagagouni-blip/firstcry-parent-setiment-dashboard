const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// POST /api/feedback/create
router.post('/create', feedbackController.createFeedback);

// GET /api/feedback/list
router.get('/list', feedbackController.listFeedback);

// GET /api/feedback/:id
router.get('/:id', feedbackController.getFeedbackById);

// GET /api/feedback/:id/detail
router.get('/:id/detail', feedbackController.getFeedbackDetail);

module.exports = router;
