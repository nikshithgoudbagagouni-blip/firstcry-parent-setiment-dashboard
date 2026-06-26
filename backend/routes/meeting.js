const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');

// POST /api/meeting/create
router.post('/create', meetingController.createMeeting);

// GET /api/meeting/list
router.get('/list', meetingController.listMeetings);

// PUT /api/meeting/:id
router.put('/:id', meetingController.updateMeeting);

module.exports = router;
