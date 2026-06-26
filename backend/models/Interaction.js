const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    default: null
  },
  type: {
    type: String,
    enum: ['email', 'portal_log', 'survey', 'rsvp', 'meeting_notes'],
    required: true
  },
  rawText: {
    type: String,
    default: ''
  },
  normalizedText: {
    type: String,
    default: ''
  },
  sentimentScore: {
    type: Number,
    default: 0 // Ranges from -1 (Negative) to 1 (Positive)
  },
  sentimentLabel: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative'],
    default: 'Neutral'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  extractedKeywords: [{
    type: String
  }],
  metadata: {
    portalLogins: { type: Number, default: 0 },
    surveyCompleted: { type: Boolean, default: false },
    eventAttended: { type: Boolean, default: false }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Interaction', InteractionSchema);
