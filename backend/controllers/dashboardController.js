const Parent = require('../models/Parent');
const Interaction = require('../models/Interaction');
const Meeting = require('../models/Meeting');
const { getIsConnected } = require('../config/db');
const mockStore = require('../data/mockStore');

exports.getDashboardSummary = async (req, res) => {
  try {
    let totalFeedback = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let highRiskParents = [];
    let scheduledMeetingsCount = 0;
    let recentActivities = [];
    let avgSentiment = 0;
    let avgEngagement = 0;

    if (getIsConnected()) {
      // MongoDB aggregations
      const interactions = await Interaction.find().populate('parentId');
      const meetings = await Meeting.find({ status: 'Scheduled' }).populate('parentId');
      const parents = await Parent.find({ admissionStatus: 'At-Risk' });

      totalFeedback = interactions.length;
      
      let sumSentiment = 0;
      let totalLogins = 0;
      let totalSurveys = 0;
      let totalEvents = 0;

      interactions.forEach(item => {
        sumSentiment += item.sentimentScore;
        
        if (item.sentimentLabel === 'Positive') positiveCount++;
        else if (item.sentimentLabel === 'Negative') negativeCount++;
        else neutralCount++;

        // Aggregate for average engagement computation
        if (item.metadata) {
          totalLogins += item.metadata.portalLogins || 0;
          if (item.metadata.surveyCompleted) totalSurveys++;
          if (item.metadata.eventAttended) totalEvents++;
        }
      });

      avgSentiment = totalFeedback > 0 ? parseFloat((sumSentiment / totalFeedback).toFixed(2)) : 0;
      
      // Compute standard average engagement across feedback samples
      if (totalFeedback > 0) {
        let totalEngagementPoints = 0;
        interactions.forEach(item => {
          const lPts = Math.min((item.metadata.portalLogins || 0) * 5, 30);
          const sPts = item.metadata.surveyCompleted ? 35 : 0;
          const ePts = item.metadata.eventAttended ? 35 : 0;
          totalEngagementPoints += (lPts + sPts + ePts);
        });
        avgEngagement = Math.round(totalEngagementPoints / totalFeedback);
      } else {
        avgEngagement = 0;
      }

      scheduledMeetingsCount = meetings.length;

      // Extract high risk parents (either labeled At-Risk or having negative feedback score)
      const allParents = await Parent.find();
      const parentRiskList = [];
      
      for (const p of allParents) {
        // Find parent's interactions
        const parentInteractions = interactions.filter(i => i.parentId && i.parentId._id.toString() === p._id.toString());
        const negativeFeedbackCount = parentInteractions.filter(i => i.sentimentLabel === 'Negative').length;
        
        // Compute individual engagement
        let latestEngagement = 50; // default midpoint
        if (parentInteractions.length > 0) {
          const latest = parentInteractions[0]; // sorted by timestamp
          const lPts = Math.min((latest.metadata.portalLogins || 0) * 5, 30);
          const sPts = latest.metadata.surveyCompleted ? 35 : 0;
          const ePts = latest.metadata.eventAttended ? 35 : 0;
          latestEngagement = lPts + sPts + ePts;
        }

        if (p.admissionStatus === 'At-Risk' || negativeFeedbackCount > 0) {
          parentRiskList.push({
            id: p._id,
            name: p.name,
            childName: p.studentName,
            email: p.email,
            phone: p.phone,
            classGrade: p.classGrade,
            status: p.admissionStatus,
            latestSentimentScore: parentInteractions.length > 0 ? parentInteractions[0].sentimentScore : -0.5,
            latestSentimentLabel: parentInteractions.length > 0 ? parentInteractions[0].sentimentLabel : 'Negative',
            engagementIndex: latestEngagement
          });
        }
      }
      highRiskParents = parentRiskList;

      // Assemble recent activities
      const recentFeedbackSlice = interactions.slice(0, 5).map(i => ({
        id: i._id,
        type: 'feedback',
        title: `Feedback from ${i.parentId ? i.parentId.name : 'Unknown parent'}`,
        description: i.rawText.substring(0, 70) + (i.rawText.length > 70 ? '...' : ''),
        sentimentLabel: i.sentimentLabel,
        rating: i.rating,
        timestamp: i.timestamp
      }));

      const recentMeetingsSlice = await Meeting.find().populate('parentId').sort({ createdAt: -1 }).limit(5);
      const recentMeetingFormatted = recentMeetingsSlice.map(m => ({
        id: m._id,
        type: 'meeting',
        title: `Meeting with ${m.parentId ? m.parentId.name : 'Unknown parent'}`,
        description: `${m.title} (${m.status})`,
        sentimentLabel: 'Neutral',
        rating: 3,
        timestamp: m.dateTime
      }));

      recentActivities = [...recentFeedbackSlice, ...recentMeetingFormatted]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8);

    } else {
      // Mock local storage analytics fallback
      const db = mockStore.loadData();
      totalFeedback = db.interactions.length;

      let sumSentiment = 0;
      db.interactions.forEach(item => {
        sumSentiment += item.sentimentScore;
        if (item.sentimentLabel === 'Positive') positiveCount++;
        else if (item.sentimentLabel === 'Negative') negativeCount++;
        else neutralCount++;
      });

      avgSentiment = totalFeedback > 0 ? parseFloat((sumSentiment / totalFeedback).toFixed(2)) : 0;

      if (totalFeedback > 0) {
        let totalPoints = 0;
        db.interactions.forEach(i => {
          const lPts = Math.min((i.metadata.portalLogins || 0) * 5, 30);
          const sPts = i.metadata.surveyCompleted ? 35 : 0;
          const ePts = i.metadata.eventAttended ? 35 : 0;
          totalPoints += (lPts + sPts + ePts);
        });
        avgEngagement = Math.round(totalPoints / totalFeedback);
      } else {
        avgEngagement = 0;
      }

      scheduledMeetingsCount = db.meetings.filter(m => m.status === 'Scheduled').length;

      const parentRiskList = [];
      db.parents.forEach(p => {
        const parentInteractions = db.interactions.filter(i => i.parentId === p.id);
        const negativeFeedbackCount = parentInteractions.filter(i => i.sentimentLabel === 'Negative').length;
        
        let latestEngagement = 50;
        if (parentInteractions.length > 0) {
          const latest = parentInteractions[parentInteractions.length - 1];
          const lPts = Math.min((latest.metadata?.portalLogins || 0) * 5, 30);
          const sPts = latest.metadata?.surveyCompleted ? 35 : 0;
          const ePts = latest.metadata?.eventAttended ? 35 : 0;
          latestEngagement = lPts + sPts + ePts;
        }

        if (p.admissionStatus === 'At-Risk' || negativeFeedbackCount > 0) {
          parentRiskList.push({
            id: p.id,
            name: p.name,
            childName: p.studentName,
            email: p.email,
            phone: p.phone,
            classGrade: p.classGrade,
            status: p.admissionStatus,
            latestSentimentScore: parentInteractions.length > 0 ? parentInteractions[parentInteractions.length - 1].sentimentScore : -0.5,
            latestSentimentLabel: parentInteractions.length > 0 ? parentInteractions[parentInteractions.length - 1].sentimentLabel : 'Negative',
            engagementIndex: latestEngagement
          });
        }
      });
      highRiskParents = parentRiskList;

      const recentFeedbackSlice = db.interactions.slice(-5).map(i => {
        const parent = db.parents.find(p => p.id === i.parentId);
        return {
          id: i.id,
          type: 'feedback',
          title: `Feedback from ${parent ? parent.name : 'Unknown parent'}`,
          description: i.rawText.substring(0, 70) + (i.rawText.length > 70 ? '...' : ''),
          sentimentLabel: i.sentimentLabel,
          rating: i.rating,
          timestamp: i.timestamp
        };
      });

      const recentMeetingFormatted = db.meetings.slice(-5).map(m => {
        const parent = db.parents.find(p => p.id === m.parentId);
        return {
          id: m.id,
          type: 'meeting',
          title: `Meeting with ${parent ? parent.name : 'Unknown parent'}`,
          description: `${m.title} (${m.status})`,
          sentimentLabel: 'Neutral',
          rating: 3,
          timestamp: m.dateTime
        };
      });

      recentActivities = [...recentFeedbackSlice, ...recentMeetingFormatted]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8);
    }

    return res.status(200).json({
      totalFeedback,
      positiveCount,
      negativeCount,
      neutralCount,
      avgSentiment,
      avgEngagement,
      scheduledMeetingsCount,
      highRiskParents,
      recentActivities
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
