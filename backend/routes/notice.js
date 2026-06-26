const express = require('express');
const router = express.Router();
const { generateNotice } = require('../services/noticeService');
const Parent = require('../models/Parent');
const { getIsConnected } = require('../config/db');
const mockStore = require('../data/mockStore');

// POST /api/notices/generate
router.post('/generate', async (req, res) => {
  try {
    const { type, parentId, dateTime, keywords = [] } = req.body;

    if (!type || !parentId) {
      return res.status(400).json({ error: 'Notice type and Parent ID are required.' });
    }

    let parentObj = null;

    if (getIsConnected()) {
      parentObj = await Parent.findById(parentId);
    } else {
      const db = mockStore.loadData();
      parentObj = db.parents.find(p => p.id === parentId);
    }

    if (!parentObj) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    // Call service to generate formatted message templates
    const notice = generateNotice(type, parentObj, { dateTime, keywords });
    
    return res.status(200).json({
      type,
      parentId,
      parentName: parentObj.name,
      studentName: parentObj.studentName,
      subject: notice.subject,
      body: notice.body,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error generating notice:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
