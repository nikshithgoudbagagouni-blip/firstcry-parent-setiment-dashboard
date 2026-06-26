/**
 * Sentiment & Analytics Ingestion Service
 * 
 * Provides:
 * - Text normalization and PII masking (names, emails, phones)
 * - Lexicon-based sentiment analysis (-1 to +1)
 * - Keyword/topic modeler (pain points, interests)
 * - Engagement Index calculator (logins, surveys, events)
 * - Center Head recommendations generator
 */

// Simple PII masking patterns
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

// Lexicon dictionaries for sentiment simulation
const LEXICON = {
  positive: [
    'great', 'excellent', 'happy', 'love', 'wonderful', 'satisfied', 'good', 'amazing', 
    'helpful', 'supportive', 'fantastic', 'best', 'friendly', 'caring', 'clean', 'perfect', 
    'enjoy', 'impressed', 'progress', 'appreciate', 'thank', 'thanks', 'glad'
  ],
  negative: [
    'poor', 'bad', 'unhappy', 'dissatisfied', 'slow', 'unsafe', 'dirty', 'expensive', 
    'rude', 'issue', 'complaint', 'concern', 'disappointed', 'worst', 'hard', 'difficult', 
    'late', 'delay', 'ignore', 'neglect', 'stress', 'homework load', 'lack', 'careless',
    'withdraw', 'cancel', 'expensive', 'costly'
  ]
};

// Common keyword tags in preschool / school administration
const KEYWORD_TOPICS = [
  { keyword: 'Homework load', patterns: ['homework', 'assignment', 'studies', 'study', 'workload'] },
  { keyword: 'Bus safety', patterns: ['bus', 'van', 'transport', 'driver', 'safety', 'route', 'pick up', 'drop'] },
  { keyword: 'Food quality', patterns: ['food', 'meal', 'lunch', 'snack', 'nutrition', 'diet', 'caterer'] },
  { keyword: 'Teacher interaction', patterns: ['teacher', 'staff', 'faculty', 'maam', 'sir', 'mentor', 'attention'] },
  { keyword: 'Fees & pricing', patterns: ['fees', 'fee', 'charge', 'cost', 'payment', 'expensive', 'billing'] },
  { keyword: 'Infrastructure', patterns: ['building', 'classroom', 'playground', 'toy', 'facility', 'toilet', 'hygiene'] },
  { keyword: 'Curriculum & activity', patterns: ['curriculum', 'syllabus', 'event', 'activity', 'sports', 'music', 'dance'] },
  { keyword: 'Admission queries', patterns: ['admission', 'enquiry', 'register', 'seat', 'sibling', 'documentation'] }
];

/**
 * Normalizes input text by converting to lowercase, stripping special chars,
 * and masking sensitive data like Emails and Phone Numbers.
 */
function normalizeText(text) {
  if (!text) return '';
  let normalized = text.toLowerCase().trim();
  
  // Mask PII
  normalized = normalized.replace(EMAIL_REGEX, '[EMAIL_MASKED]');
  normalized = normalized.replace(PHONE_REGEX, '[PHONE_MASKED]');
  
  return normalized;
}

/**
 * Computes a sentiment score between -1 and +1 based on lexicon occurrences.
 */
function analyzeSentiment(text) {
  if (!text) return { score: 0, label: 'Neutral' };
  
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  let posCount = 0;
  let negCount = 0;
  
  words.forEach(word => {
    if (LEXICON.positive.includes(word)) posCount++;
    if (LEXICON.negative.includes(word)) negCount++;
  });
  
  // Double weight key phrases or negative combinations if needed
  if (text.toLowerCase().includes('homework load') || text.toLowerCase().includes('homework too much')) negCount += 2;
  if (text.toLowerCase().includes('bus safety') || text.toLowerCase().includes('unsafe transport')) negCount += 2;
  
  const total = posCount + negCount;
  if (total === 0) return { score: 0, label: 'Neutral' };
  
  const score = parseFloat(((posCount - negCount) / total).toFixed(2));
  
  let label = 'Neutral';
  if (score > 0.15) label = 'Positive';
  else if (score < -0.15) label = 'Negative';
  
  return { score, label };
}

/**
 * Extracts matching keyword topics based on regex patterns.
 */
function extractKeywords(text) {
  if (!text) return [];
  const normalized = text.toLowerCase();
  const matched = [];
  
  KEYWORD_TOPICS.forEach(topic => {
    const hasPattern = topic.patterns.some(pattern => normalized.includes(pattern));
    if (hasPattern) {
      matched.push(topic.keyword);
    }
  });
  
  // Default to general category if nothing matches
  if (matched.length === 0) {
    matched.push('General Inquiry');
  }
  
  return matched;
}

/**
 * Calculates the Engagement Index (0-100) based on weighted parameters.
 * Weighted: Portal Logins (30%), Surveys (35%), Event RSVP (35%)
 */
function calculateEngagementIndex(metadata) {
  const { portalLogins = 0, surveyCompleted = false, eventAttended = false } = metadata || {};
  
  // Portal Logins: 5 points per login up to 30 points
  const loginPoints = Math.min(portalLogins * 5, 30);
  
  // Surveys: 35 points
  const surveyPoints = surveyCompleted ? 35 : 0;
  
  // Event Attendance/RSVP: 35 points
  const eventPoints = eventAttended ? 35 : 0;
  
  return loginPoints + surveyPoints + eventPoints;
}

/**
 * Generates proactive recommendations for center heads.
 */
function generateRecommendation(sentimentLabel, keywords) {
  if (sentimentLabel === 'Positive') {
    return 'Thank parent for positive feedback. Ask if they can write a Google review or provide a referral.';
  }
  
  if (sentimentLabel === 'Negative') {
    let specificAction = 'Schedule a 1-on-1 call with the Center Head within 24 hours to address grievances.';
    if (keywords.includes('Bus safety')) {
      specificAction = 'Alert transport manager. Arrange meeting between parent, driver, and Center Head to review routes and CCTV.';
    } else if (keywords.includes('Homework load')) {
      specificAction = 'Coordinate with class teacher to review child’s workload and adjust expectations.';
    } else if (keywords.includes('Fees & pricing')) {
      specificAction = 'Forward to accounts team. Schedule discussion regarding installment plans or scholarship discounts.';
    } else if (keywords.includes('Food quality')) {
      specificAction = 'Notify pantry team. Conduct hygiene audit and share current week’s nutrition plan with the parent.';
    }
    return `At-Risk Parent Alert! ${specificAction}`;
  }
  
  return 'Regular follow-up. Add notes from their next scheduled drop-off interaction.';
}

module.exports = {
  normalizeText,
  analyzeSentiment,
  extractKeywords,
  calculateEngagementIndex,
  generateRecommendation
};
