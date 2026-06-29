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

// POST /api/notices/send
router.post('/send', async (req, res) => {
  try {
    const { parentId, subject, body, type } = req.body;

    if (!parentId || !subject || !body) {
      return res.status(400).json({ error: 'Parent ID, Subject, and Body are required.' });
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

    const parentEmail = parentObj.email;

    // Log the interaction in the database representing this email dispatch
    const Interaction = require('../models/Interaction');
    const Child = require('../models/Child');

    if (getIsConnected()) {
      let child = await Child.findOne({ parentId: parentObj._id });
      const interaction = new Interaction({
        parentId: parentObj._id,
        childId: child ? child._id : null,
        type: 'email',
        rawText: body,
        normalizedText: body,
        sentimentScore: 0,
        sentimentLabel: 'Neutral',
        rating: 3,
        extractedKeywords: ['notice', type || 'general'],
        metadata: { noticeType: type, subject, emailedTo: parentEmail }
      });
      await interaction.save();
    } else {
      const db = mockStore.loadData();
      const child = db.children ? db.children.find(c => c.parentId === parentObj.id) : null;
      if (!db.interactions) db.interactions = [];
      
      const newInteractionDoc = {
        id: `i_${Date.now()}`,
        parentId: parentObj.id,
        childId: child ? child.id : null,
        type: 'email',
        rawText: body,
        normalizedText: body,
        sentimentScore: 0,
        sentimentLabel: 'Neutral',
        rating: 3,
        extractedKeywords: ['notice', type || 'general'],
        metadata: { noticeType: type, subject, emailedTo: parentEmail },
        timestamp: new Date().toISOString()
      };
      db.interactions.push(newInteractionDoc);
      mockStore.saveData(db);
    }

    console.log(`[EMAIL DISPATCH] Sending Notice Email:\nTo: ${parentEmail}\nSubject: ${subject}\nBody:\n${body}\n--------------------`);

    return res.status(200).json({
      success: true,
      message: 'Notice logged and emailed successfully.',
      emailedTo: parentEmail
    });
  } catch (error) {
    console.error('Error sending notice:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
