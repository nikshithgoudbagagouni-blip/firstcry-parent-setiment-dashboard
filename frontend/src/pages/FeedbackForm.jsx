import React, { useState } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  User, 
  Mail, 
  Phone, 
  Baby, 
  Star, 
  Loader2, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';

export default function FeedbackForm({ backendUrl }) {
  const [formData, setFormData] = useState({
    parentName: '',
    childName: '',
    contactNumber: '',
    email: '',
    admissionStatus: 'Admitted',
    category: 'Teacher interaction',
    message: '',
    rating: 5,
    portalLogins: 4,
    surveyCompleted: true,
    eventAttended: false
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState('');

  const categories = [
    'Teacher interaction',
    'Bus safety',
    'Food quality',
    'Fees & pricing',
    'Infrastructure',
    'Curriculum & activity',
    'Admission queries'
  ];

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleStarClick = (ratingVal) => {
    setFormData(prev => ({ ...prev, rating: ratingVal }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.parentName || !formData.email || !formData.message) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    setResultData(null);

    try {
      const response = await axios.post(`${backendUrl}/api/feedback/create`, formData);
      setResultData(response.data);
      setSuccess(true);
      
      // Clear message field
      setFormData(prev => ({
        ...prev,
        message: ''
      }));
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.error || 'Failed to submit feedback. Check database connections.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Feedback Ingestion</h2>
        <p className="text-slate-400 text-sm mt-1">Submit parent feedback details to trigger the NLP analytics pipeline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Container Panel */}
        <div className="glass-panel p-6 lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800/40 pb-2">Parent & Child Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="parentName">Parent Name <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    id="parentName"
                    type="text"
                    placeholder="Rahul Sharma"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="childName">Child Name</label>
                <div className="relative">
                  <Baby className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    id="childName"
                    type="text"
                    placeholder="Aarav Sharma"
                    value={formData.childName}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="email">Email ID <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    placeholder="parent@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="contactNumber">Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    id="contactNumber"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white pt-2 border-b border-slate-800/40 pb-2">Feedback Specifications</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="admissionStatus">Admission Status</label>
                <select
                  id="admissionStatus"
                  value={formData.admissionStatus}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="Enquired">Enquired</option>
                  <option value="Registered">Registered</option>
                  <option value="Admitted">Admitted</option>
                  <option value="Withdrawn">Withdrawn</option>
                  <option value="At-Risk">At-Risk</option>
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="category">Feedback Category</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Satisfaction Rating</label>
              <div className="flex gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    className="hover:scale-110 transition-transform duration-100"
                  >
                    <Star 
                      className={`h-7 w-7 ${
                        star <= formData.rating 
                          ? 'fill-amber-450 text-amber-450' 
                          : 'text-slate-600'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="message">Feedback Message <span className="text-rose-500">*</span></label>
              <textarea
                id="message"
                rows="4"
                placeholder="Type the message received from email, survey, or teacher notes..."
                value={formData.message}
                onChange={handleInputChange}
                className="form-input resize-none"
                required
              />
            </div>

            <h3 className="text-lg font-bold text-white pt-2 border-b border-slate-800/40 pb-2">School Portal Activity Indicators</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#FCFAF7] p-4 rounded-xl border border-[#E6DDD0]/60">
              <div>
                <label className="form-label" htmlFor="portalLogins">Portal Logins (Month)</label>
                <input
                  id="portalLogins"
                  type="number"
                  min="0"
                  value={formData.portalLogins}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="flex items-center gap-2 mt-7">
                <input
                  id="surveyCompleted"
                  type="checkbox"
                  checked={formData.surveyCompleted}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-[#E6DDD0] bg-white text-[#FF8562] focus:ring-[#FF8562] focus:ring-offset-[#FAF7F2]"
                />
                <label htmlFor="surveyCompleted" className="text-sm font-bold text-[#6B6152] select-none">
                  Completed Surveys
                </label>
              </div>
              <div className="flex items-center gap-2 mt-7">
                <input
                  id="eventAttended"
                  type="checkbox"
                  checked={formData.eventAttended}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-[#E6DDD0] bg-white text-[#FF8562] focus:ring-[#FF8562] focus:ring-offset-[#FAF7F2]"
                />
                <label htmlFor="eventAttended" className="text-sm font-bold text-[#6B6152] select-none">
                  Attended Center Events
                </label>
              </div>
            </div>

            {error && (
              <div className="text-rose-400 text-xs font-semibold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing pipeline...</span>
                </>
              ) : (
                <span>Ingest Parent Feedback</span>
              )}
            </button>
          </form>
        </div>

        {/* Real-time Pipeline Extraction Results Side Panel */}
        <div className="space-y-6">
          <div className="glass-panel p-6 bg-white/95 border-[#E6DDD0] relative">
            <h3 className="text-lg font-bold text-[#4A433A] mb-2 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-[#FF8562]" /> Sentiment Engine
            </h3>
            <p className="text-slate-455 text-xs mb-6">Pipeline details of the latest ingestion will show up here.</p>

            {success && resultData ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-2.5 text-emerald-600 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-xs font-semibold mb-4">
                  <CheckCircle className="h-5 w-5" />
                  <span>Successfully processed into database</span>
                </div>

                <div className="bg-[#FCFAF7] p-4 rounded-xl border border-[#E6DDD0] space-y-4">
                  <div className="flex justify-between items-center text-xs text-[#4A433A]">
                    <span className="text-slate-400 font-semibold uppercase">Sentiment label</span>
                    <span className={`badge-${resultData.sentiment.label.toLowerCase()}`}>
                      {resultData.sentiment.label}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#4A433A]">
                    <span className="text-slate-400 font-semibold uppercase">Score (-1 to 1)</span>
                    <span className="font-bold text-[#4A433A] flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-[#FF8562]" /> {resultData.sentiment.score}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#4A433A]">
                    <span className="text-slate-400 font-semibold uppercase">Engagement Index</span>
                    <span className="font-bold text-[#88B097]">{resultData.engagementIndex} / 100</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-450 font-semibold uppercase block mb-1.5">Extracted keywords</span>
                    <div className="flex flex-wrap gap-1.5">
                      {resultData.keywords.map(kw => (
                        <span key={kw} className="text-[10px] bg-[#FF8562]/10 text-[#FF8562] border border-[#FF8562]/20 px-2 py-0.5 rounded-md font-semibold">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#FF8562]/10 rounded-xl border border-[#FF8562]/25 text-xs">
                  <span className="font-bold text-[#FF8562] block mb-1">Center Head Recommendation:</span>
                  <p className="text-[#4A433A] leading-relaxed font-semibold">{resultData.recommendation || (resultData.parent.admissionStatus === 'At-Risk' ? 'Schedule a 1-on-1 review meeting promptly.' : 'Regular follow-up.')}</p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#E6DDD0] py-16 px-4 text-center rounded-2xl flex flex-col items-center">
                <HelpCircle className="h-10 w-10 text-[#9E9588] mb-3" />
                <p className="text-slate-500 text-xs leading-relaxed max-w-[200px]">
                  Fill out and submit the parent feedback form to trigger real-time sentiment scoring.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
