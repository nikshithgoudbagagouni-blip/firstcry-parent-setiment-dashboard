const Interaction = require('../models/Interaction');
const Parent = require('../models/Parent');
const Meeting = require('../models/Meeting');
const { getIsConnected } = require('../config/db');
const mockStore = require('../data/mockStore');

exports.exportReport = async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    let parents = [];
    let interactions = [];
    let meetings = [];

    let db = null;
    if (getIsConnected()) {
      parents = await Parent.find();
      interactions = await Interaction.find().populate('parentId').populate('childId');
      meetings = await Meeting.find().populate('parentId');
    } else {
      db = mockStore.loadData();
      parents = db.parents;
      interactions = db.interactions;
      meetings = db.meetings;
    }

    // Process Report Analytics
    const totalInteractions = interactions.length;
    let positive = 0, negative = 0, neutral = 0;
    const keywordCounts = {};

    interactions.forEach(item => {
      if (item.sentimentLabel === 'Positive') positive++;
      else if (item.sentimentLabel === 'Negative') negative++;
      else neutral++;

      const kws = item.extractedKeywords || [];
      kws.forEach(kw => {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      });
    });

    const sentimentRatios = {
      positivePercent: totalInteractions > 0 ? Math.round((positive / totalInteractions) * 100) : 0,
      negativePercent: totalInteractions > 0 ? Math.round((negative / totalInteractions) * 100) : 0,
      neutralPercent: totalInteractions > 0 ? Math.round((neutral / totalInteractions) * 100) : 0
    };

    const topKeywords = Object.keys(keywordCounts).map(k => ({
      keyword: k,
      count: keywordCounts[k]
    })).sort((a, b) => b.count - a.count);

    const atRiskParents = parents
      .filter(p => p.admissionStatus === 'At-Risk')
      .map(p => ({
        name: p.name,
        email: p.email,
        phone: p.phone || p.contact_number,
        studentName: p.studentName,
        classGrade: p.classGrade
      }));

    if (format.toLowerCase() === 'csv') {
      // Build a clean CSV format for spreadsheet importing
      let csvContent = 'ID,Parent Name,Student Name,Feedback Category,Feedback Content,Sentiment Score,Sentiment Label,Rating,Timestamp\n';
      
      interactions.forEach((item, index) => {
        const parentName = getIsConnected() 
          ? (item.parentId ? item.parentId.name : 'Unknown')
          : (parents.find(p => p.id === item.parentId)?.name || 'Unknown');

        const studentName = getIsConnected()
          ? (item.childId ? item.childId.name : (item.parentId ? item.parentId.studentName : 'Unknown'))
          : ((db && db.children && db.children.find(c => c.id === item.childId)?.name) || parents.find(p => p.id === item.parentId)?.studentName || 'Unknown');

        const rating = item.rating;
        const sentimentLabel = item.sentimentLabel;
        const sentimentScore = item.sentimentScore;
        const timestamp = getIsConnected() ? item.timestamp.toISOString() : item.timestamp;
        
        // Clean text to avoid breaking CSV columns
        const message = item.rawText.replace(/"/g, '""').replace(/\n/g, ' ');
        const keyword = (item.extractedKeywords && item.extractedKeywords.length > 0) ? item.extractedKeywords[0] : 'General';

        csvContent += `"${index + 1}","${parentName}","${studentName}","${keyword}","${message}","${sentimentScore}","${sentimentLabel}","${rating}","${timestamp}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="firstcry_sentiment_report.csv"');
      return res.status(200).send(csvContent);
    }

    // Default JSON structure
    return res.status(200).json({
      reportGeneratedAt: new Date(),
      totalParents: parents.length,
      totalFeedback: totalInteractions,
      sentimentCounts: { positive, negative, neutral },
      sentimentRatios,
      topKeywords,
      atRiskCount: atRiskParents.length,
      atRiskParents,
      scheduledMeetingsCount: meetings.filter(m => m.status === 'Scheduled').length,
      meetings: meetings.map(m => {
        const pName = getIsConnected() ? (m.parentId ? m.parentId.name : 'Unknown') : (parents.find(p => p.id === m.parentId)?.name || 'Unknown');
        return {
          title: m.title,
          parent: pName,
          date: m.dateTime,
          status: m.status
        };
      })
    });

  } catch (error) {
    console.error('Error exporting report:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
