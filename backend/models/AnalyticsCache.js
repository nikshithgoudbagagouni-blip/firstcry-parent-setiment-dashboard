const mongoose = require('mongoose');

const ConcernSchema = new mongoose.Schema({
  keyword: { type: String, required: true },
  count: { type: Number, default: 1 }
}, { _id: false });

const AnalyticsCacheSchema = new mongoose.Schema({
  classGrade: {
    type: String,
    required: true,
    default: 'school-wide' // Can be class specific or school-wide
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  avgSentimentScore: {
    type: Number,
    required: true,
    default: 0
  },
  avgEngagementIndex: {
    type: Number,
    required: true,
    default: 0 // Ranges from 0 to 100
  },
  activeAlertsCount: {
    type: Number,
    required: true,
    default: 0
  },
  keyConcerns: [ConcernSchema]
});

module.exports = mongoose.model('AnalyticsCache', AnalyticsCacheSchema);
