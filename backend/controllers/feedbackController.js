const Parent = require('../models/Parent');
const Child = require('../models/Child');
const Interaction = require('../models/Interaction');
const { getIsConnected } = require('../config/db');
const mockStore = require('../data/mockStore');
const { normalizeText, analyzeSentiment, extractKeywords, calculateEngagementIndex, generateRecommendation } = require('../services/sentimentService');

// Create Feedback
exports.createFeedback = async (req, res) => {
  try {
    const { 
      parentName, 
      childName, 
      contactNumber, 
      email, 
      admissionStatus = 'Enquired', 
      category, 
      message, 
      rating, 
      meetingDate,
      portalLogins = 0,
      surveyCompleted = false,
      eventAttended = false
    } = req.body;

    if (!parentName || !email || !message) {
      return res.status(400).json({ error: 'Parent Name, Email, and Feedback Message are required.' });
    }

    // 1. Text Ingestion & Pipeline
    const normalized = normalizeText(message);
    const { score, label } = analyzeSentiment(normalized);
    const keywords = extractKeywords(normalized);
    
    // Fallback if category was manually sent, include it
    if (category && !keywords.includes(category)) {
      keywords.unshift(category);
    }

    // Compute Engagement
    const engagementIndex = calculateEngagementIndex({ portalLogins, surveyCompleted, eventAttended });
    const recommendation = generateRecommendation(label, keywords);

    let finalParentDoc = null;
    let newInteractionDoc = null;

    if (getIsConnected()) {
      // MongoDB Flow
      // Find or create parent
      let parent = await Parent.findOne({ email: email.toLowerCase() });
      
      // Determine if at risk: if sentiment is negative or user is marked as withdrawn/at-risk
      let activeStatus = admissionStatus;
      if (label === 'Negative') {
        activeStatus = 'At-Risk';
      }

      if (!parent) {
        parent = new Parent({
          name: parentName,
          email: email.toLowerCase(),
          phone: contactNumber || 'Not Provided',
          studentName: childName || 'TBD',
          studentId: `FC-${Date.now().toString().slice(-4)}`,
          classGrade: 'General Playgroup',
          admissionStatus: activeStatus
        });
        await parent.save();
      } else {
        // Update details if supplied
        if (contactNumber) parent.phone = contactNumber;
        if (childName) parent.studentName = childName;
        parent.admissionStatus = activeStatus;
        await parent.save();
      }
      finalParentDoc = parent;

      // Find or create child
      const activeChildName = childName || parent.studentName || 'TBD';
      let child = await Child.findOne({ parentId: parent._id, name: activeChildName });
      if (!child) {
        child = new Child({
          parentId: parent._id,
          name: activeChildName,
          classGrade: parent.classGrade || 'General Playgroup',
          dateOfBirth: null
        });
        await child.save();
      }

      // Save Interaction
      const interaction = new Interaction({
        parentId: parent._id,
        childId: child._id,
        type: 'email', // Defaulting to email feedback type
        rawText: message,
        normalizedText: normalized,
        sentimentScore: score,
        sentimentLabel: label,
        rating: rating || 3,
        extractedKeywords: keywords,
        metadata: { portalLogins, surveyCompleted, eventAttended }
      });
      await interaction.save();
      newInteractionDoc = interaction;
    } else {
      // Mock File System Flow
      const db = mockStore.loadData();
      let parent = db.parents.find(p => p.email.toLowerCase() === email.toLowerCase());
      
      let activeStatus = admissionStatus;
      if (label === 'Negative') {
        activeStatus = 'At-Risk';
      }

      if (!parent) {
        parent = {
          id: `p_${Date.now()}`,
          name: parentName,
          email: email.toLowerCase(),
          phone: contactNumber || 'Not Provided',
          studentName: childName || 'TBD',
          studentId: `FC-${Date.now().toString().slice(-4)}`,
          classGrade: 'General Playgroup',
          admissionStatus: activeStatus,
          createdAt: new Date().toISOString()
        };
        db.parents.push(parent);
      } else {
        if (contactNumber) parent.phone = contactNumber;
        if (childName) parent.studentName = childName;
        parent.admissionStatus = activeStatus;
      }
      finalParentDoc = parent;

      // Find or create child in mock db
      if (!db.children) db.children = [];
      const activeChildName = childName || parent.studentName || 'TBD';
      let child = db.children.find(c => c.parentId === parent.id && c.name.toLowerCase() === activeChildName.toLowerCase());
      if (!child) {
        child = {
          id: `c_${Date.now()}`,
          parentId: parent.id,
          name: activeChildName,
          classGrade: parent.classGrade || 'General Playgroup',
          dateOfBirth: null,
          createdAt: new Date().toISOString()
        };
        db.children.push(child);
      }

      newInteractionDoc = {
        id: `i_${Date.now()}`,
        parentId: parent.id,
        childId: child.id,
        type: 'email',
        rawText: message,
        normalizedText: normalized,
        sentimentScore: score,
        sentimentLabel: label,
        rating: Number(rating) || 3,
        extractedKeywords: keywords,
        metadata: { portalLogins: Number(portalLogins), surveyCompleted, eventAttended },
        timestamp: new Date().toISOString()
      };
      db.interactions.push(newInteractionDoc);
      mockStore.saveData(db);
    }

    return res.status(201).json({
      message: 'Feedback received and processed successfully',
      sentiment: { score, label },
      engagementIndex,
      keywords,
      recommendation,
      parent: finalParentDoc,
      interaction: newInteractionDoc
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// List Feedback
exports.listFeedback = async (req, res) => {
  try {
    if (getIsConnected()) {
      const list = await Interaction.find().populate('parentId').populate('childId').sort({ timestamp: -1 });
      const formatted = list.map(item => ({
        id: item._id,
        parentId: item.parentId ? item.parentId._id : '',
        parentName: item.parentId ? item.parentId.name : 'Unknown',
        email: item.parentId ? item.parentId.email : '',
        phone: item.parentId ? item.parentId.phone : '',
        studentName: item.childId ? item.childId.name : (item.parentId ? item.parentId.studentName : ''),
        classGrade: item.childId ? item.childId.classGrade : (item.parentId ? item.parentId.classGrade : ''),
        type: item.type,
        rawText: item.rawText,
        sentimentScore: item.sentimentScore,
        sentimentLabel: item.sentimentLabel,
        rating: item.rating,
        extractedKeywords: item.extractedKeywords,
        timestamp: item.timestamp,
        metadata: item.metadata
      }));
      return res.status(200).json(formatted);
    } else {
      const db = mockStore.loadData();
      const formatted = db.interactions.map(item => {
        const parent = db.parents.find(p => p.id === item.parentId);
        const child = db.children ? db.children.find(c => c.id === item.childId) : null;
        return {
          id: item.id,
          parentId: item.parentId,
          parentName: parent ? parent.name : 'Unknown',
          email: parent ? parent.email : '',
          phone: parent ? parent.phone : '',
          studentName: child ? child.name : (parent ? parent.studentName : ''),
          classGrade: child ? child.classGrade : (parent ? parent.classGrade : ''),
          type: item.type,
          rawText: item.rawText,
          sentimentScore: item.sentimentScore,
          sentimentLabel: item.sentimentLabel,
          rating: item.rating,
          extractedKeywords: item.extractedKeywords,
          timestamp: item.timestamp,
          metadata: item.metadata
        };
      }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return res.status(200).json(formatted);
    }
  } catch (error) {
    console.error('Error fetching feedback list:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get Feedback by ID
exports.getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsConnected()) {
      const item = await Interaction.findById(id).populate('parentId').populate('childId');
      if (!item) return res.status(404).json({ error: 'Feedback not found' });
      return res.status(200).json(item);
    } else {
      const db = mockStore.loadData();
      const item = db.interactions.find(i => i.id === id);
      if (!item) return res.status(404).json({ error: 'Feedback not found' });
      const parent = db.parents.find(p => p.id === item.parentId);
      const child = db.children ? db.children.find(c => c.id === item.childId) : null;
      return res.status(200).json({
        ...item,
        parentId: parent,
        childId: child
      });
    }
  } catch (error) {
    console.error('Error fetching feedback by ID:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get Parent Detail (Aggregates Parent Profile, Feedbacks & PTM Meetings)
exports.getFeedbackDetail = async (req, res) => {
  try {
    const { id } = req.params; // Parent ID
    const Meeting = require('../models/Meeting');

    if (getIsConnected()) {
      const parent = await Parent.findById(id);
      if (!parent) return res.status(404).json({ error: 'Parent record not found.' });

      const children = await Child.find({ parentId: id });
      const interactions = await Interaction.find({ parentId: id }).populate('childId').sort({ timestamp: -1 });
      const meetings = await Meeting.find({ parentId: id }).sort({ dateTime: -1 });

      return res.status(200).json({
        parent,
        children,
        interactions,
        meetings
      });
    } else {
      const db = mockStore.loadData();
      const parent = db.parents.find(p => p.id === id);
      if (!parent) return res.status(404).json({ error: 'Parent record not found.' });

      const children = db.children ? db.children.filter(c => c.parentId === id) : [];
      const interactions = db.interactions
        .filter(i => i.parentId === id)
        .map(i => {
          const child = db.children ? db.children.find(c => c.id === i.childId) : null;
          return { ...i, childId: child };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      const meetings = db.meetings
        .filter(m => m.parentId === id)
        .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

      return res.status(200).json({
        parent,
        children,
        interactions,
        meetings
      });
    }
  } catch (error) {
    console.error('Error fetching aggregated parent detail:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
