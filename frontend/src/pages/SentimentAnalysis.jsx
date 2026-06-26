import React, { useState } from 'react';
import axios from 'axios';
import { 
  Sparkles, 
  BrainCircuit, 
  HelpCircle, 
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  HelpCircle as HelpIcon,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

export default function SentimentAnalysis({ backendUrl }) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Sample templates to let users test instantly
  const templates = [
    {
      label: "Positive Bus/Teacher",
      text: "The new van driver is extremely polite and punctual. Also, Priya Ma'am is doing a wonderful job with Aarav's vocabulary!"
    },
    {
      label: "Negative Workload",
      text: "Diya is crying every evening because of the excessive writing homework. It is too stressful for a four year old child."
    },
    {
      label: "Negative Bus Safety",
      text: "Extremely disappointed with the transport service. Yesterday the school bus was speeding and missed the drop-off point."
    },
    {
      label: "Neutral Inquiries",
      text: "Could you please share the syllabus for the next term? We are planning a short family trip next weekend."
    }
  ];

  const handleProcessText = async (textToProcess) => {
    const text = textToProcess || inputText;
    if (!text.trim()) {
      alert('Please enter some text or select a template.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${backendUrl}/api/sentiment/process`, { text });
      setResult(response.data);
    } catch (err) {
      console.error('NLP error:', err);
      setError('Failed to contact the sentiment engine. Check server status.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (text) => {
    setInputText(text);
    handleProcessText(text);
  };

  return (
    <div className="flex-1 p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Sentiment Sandbox</h2>
        <p className="text-slate-400 text-sm mt-1">Interactive playground to run on-the-fly NLP sentiment analyses and keyword extractions</p>
      </div>

      {/* Templates Row */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quick Test Templates</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {templates.map((tpl, i) => (
            <button
              key={i}
              onClick={() => handleTemplateSelect(tpl.text)}
              className="p-3 text-left bg-[#FCFAF7] hover:bg-[#FAF7F2] border border-[#E6DDD0] hover:border-[#FF8562]/40 rounded-xl transition text-xs font-semibold space-y-1.5"
            >
              <div className="flex justify-between items-center text-[#FF8562]">
                <span>{tpl.label}</span>
                <Sparkles className="h-3 w-3" />
              </div>
              <p className="text-slate-455 truncate">{tpl.text}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Test Area input */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Input Communication Text</h3>
            <p className="text-slate-400 text-xs">
              Paste email messages, parent portal notes, or verbal complaint transcriptions here. Personal Identifiable Information (PII) like phone numbers or emails will be automatically masked by the processor.
            </p>

            <textarea
              rows="9"
              placeholder="Paste text here (e.g., I am happy with the clean playroom, but fees are too high...)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="form-input text-sm resize-none font-mono"
            />
          </div>

          <div className="mt-6 flex justify-between gap-4">
            <button
              onClick={() => setInputText('')}
              className="btn-secondary px-6 text-sm"
              disabled={loading}
            >
              Clear
            </button>
            <button
              onClick={() => handleProcessText(null)}
              className="btn-primary flex-1 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? 'Running diagnostics...' : 'Process Analytics'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="glass-panel p-6 bg-white/95 border-[#E6DDD0]">
          <h3 className="text-lg font-bold text-[#4A433A] mb-4 flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-[#FF8562]" /> Pipeline Diagnostics
          </h3>
          
          {error && (
            <div className="p-4 bg-rose-50/10 border border-rose-100 text-rose-600 text-xs font-semibold rounded-xl flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Score Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#FCFAF7] border border-[#E6DDD0] rounded-xl">
                  <span className="text-[10px] text-[#7D7263] font-bold uppercase block mb-1">Sentiment Rating</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`badge-${result.label.toLowerCase()}`}>{result.label}</span>
                    <span className="font-bold text-[#4A433A] text-sm">{result.score}</span>
                  </div>
                </div>

                <div className="p-4 bg-[#FCFAF7] border border-[#E6DDD0] rounded-xl">
                  <span className="text-[10px] text-[#7D7263] font-bold uppercase block mb-1">PII Status</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-emerald-600 text-[10px] font-bold border border-emerald-500/20 px-2 py-0.5 rounded-full bg-emerald-500/10 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Safe
                    </span>
                    <span className="text-slate-455 text-[10px] font-semibold">Masked</span>
                  </div>
                </div>
              </div>

              {/* Masked Output */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#7D7263] font-bold uppercase block">Normalized & Masked Text (PII Masking)</span>
                <div className="p-3.5 bg-[#FCFAF7] border border-[#E6DDD0] rounded-xl text-xs font-mono text-[#4A433A] leading-relaxed break-words">
                  {result.normalized}
                </div>
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#7D7263] font-bold uppercase block">Extracted Core Topics</span>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords.length > 0 ? (
                    result.keywords.map(kw => (
                      <span key={kw} className="text-[10px] font-bold bg-[#FF8562]/10 text-[#FF8562] border border-[#FF8562]/20 px-2.5 py-1 rounded-md">
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">None detected (General Inquiry)</span>
                  )}
                </div>
              </div>

              {/* Action recommendation */}
              <div className="p-4 bg-[#FF8562]/10 border border-[#FF8562]/25 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-[#FF8562] font-bold text-xs">
                  <Lightbulb className="h-4 w-4" /> Recommended Administrative Action
                </div>
                <p className="text-[#4A433A] text-xs leading-relaxed font-semibold">
                  {result.recommendation}
                </p>
              </div>

            </div>
          ) : (
            <div className="border-2 border-dashed border-[#E6DDD0] py-28 px-4 text-center rounded-2xl flex flex-col items-center justify-center h-[340px]">
              <HelpIcon className="h-10 w-10 text-[#9E9588] mb-3" />
              <p className="text-slate-550 text-xs leading-relaxed max-w-[200px]">
                Paste text on the left pane and hit Process to review the NLP classifier details.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
