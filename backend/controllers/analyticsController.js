const Interaction = require('../models/Interaction');
const AnalyticsCache = require('../models/AnalyticsCache');
const { getIsConnected } = require('../config/db');
const mockStore = require('../data/mockStore');

// GET /api/analytics/trends
exports.getTrends = async (req, res) => {
  try {
    const { classGrade = 'school-wide', limit = 10 } = req.query;

    if (getIsConnected()) {
      // Find cached daily logs or aggregate live
      let cache = await AnalyticsCache.find({ classGrade })
        .sort({ date: 1 })
        .limit(Number(limit));

      // If cache is empty, aggregate live on-the-fly
      if (cache.length === 0) {
        const interactions = await Interaction.find().populate('parentId');
        
        // Group interactions by date (YYYY-MM-DD)
        const groups = {};
        interactions.forEach(item => {
          const dateStr = new Date(item.timestamp).toISOString().split('T')[0];
          if (!groups[dateStr]) {
            groups[dateStr] = {
              sentimentScores: [],
              engagementPointsList: [],
              keywords: {}
            };
          }
          groups[dateStr].sentimentScores.push(item.sentimentScore);
          
          const lPts = Math.min((item.metadata.portalLogins || 0) * 5, 30);
          const sPts = item.metadata.surveyCompleted ? 35 : 0;
          const ePts = item.metadata.eventAttended ? 35 : 0;
          groups[dateStr].engagementPointsList.push(lPts + sPts + ePts);
          
          item.extractedKeywords.forEach(kw => {
            groups[dateStr].keywords[kw] = (groups[dateStr].keywords[kw] || 0) + 1;
          });
        });

        const formatted = Object.keys(groups).sort().map(dateStr => {
          const g = groups[dateStr];
          const avgSent = g.sentimentScores.reduce((a, b) => a + b, 0) / g.sentimentScores.length;
          const avgEng = g.engagementPointsList.reduce((a, b) => a + b, 0) / g.engagementPointsList.length;
          const keyConcerns = Object.keys(g.keywords).map(kw => ({
            keyword: kw,
            count: g.keywords[kw]
          }));

          return {
            date: dateStr,
            avgSentimentScore: parseFloat(avgSent.toFixed(2)),
            avgEngagementIndex: Math.round(avgEng),
            keyConcerns
          };
        });
        return res.status(200).json(formatted);
      }

      return res.status(200).json(cache);
    } else {
      // Fallback Mock Local Data Flow
      const db = mockStore.loadData();
      let trends = db.analyticsCache.map(c => ({
        date: c.date.split('T')[0],
        avgSentimentScore: c.avgSentimentScore,
        avgEngagementIndex: c.avgEngagementIndex,
        activeAlertsCount: c.activeAlertsCount,
        keyConcerns: c.keyConcerns
      }));
      return res.status(200).json(trends);
    }
  } catch (error) {
    console.error('Error fetching analytics trends:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
