const { normalizeText, analyzeSentiment, extractKeywords, generateRecommendation } = require('../services/sentimentService');

exports.processText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text content is required for processing.' });
    }

    const normalized = normalizeText(text);
    const { score, label } = analyzeSentiment(normalized);
    const keywords = extractKeywords(normalized);
    const recommendation = generateRecommendation(label, keywords);

    return res.status(200).json({
      text,
      normalized,
      score,
      label,
      keywords,
      recommendation,
      processedAt: new Date()
    });
  } catch (error) {
    console.error('Error processing sentiment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
