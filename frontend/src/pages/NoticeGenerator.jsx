import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  User, 
  Sliders, 
  Copy, 
  Check, 
  Send, 
  Loader2, 
  AlertCircle,
  Clock,
  ThumbsUp,
  AlertTriangle,
  Mail
} from 'lucide-react';

export default function NoticeGenerator({ backendUrl, preselectedParentId }) {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [sentStatus, setSentStatus] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    parentId: '',
    type: 'meeting',
    dateTime: '',
    keywords: ''
  });

  const [noticeResult, setNoticeResult] = useState(null);

  const fetchParentsList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/feedback/parents`);
      
      const uniqueParents = [];
      const parentIds = new Set();
      response.data.forEach(item => {
        if (item.email && !parentIds.has(item.email)) {
          parentIds.add(item.email);
          uniqueParents.push({
            id: item.parentId?._id || item.parentId || item.id,
            name: item.parentName,
            childName: item.studentName,
            status: item.classGrade, // classGrade or status fallback
            email: item.email
          });
        }
      });
      setParents(uniqueParents);

      if (preselectedParentId) {
        const found = uniqueParents.find(p => p.id === preselectedParentId);
        if (found) {
          setFormData(prev => ({ ...prev, parentId: found.id }));
        }
      } else if (uniqueParents.length > 0) {
        setFormData(prev => ({ ...prev, parentId: uniqueParents[0].id }));
      }
    } catch (err) {
      console.error('Error fetching parent list for notices:', err);
      setError('Failed to fetch parents database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentsList();
  }, [preselectedParentId]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleGenerateNotice = async (e) => {
    e.preventDefault();
    if (!formData.parentId || !formData.type) {
      alert('Please select parent and notice type.');
      return;
    }

    setSubmitLoading(true);
    setCopied(false);
    setSentStatus(false);
    setNoticeResult(null);

    // Convert comma separated keywords to array
    const keywordArray = formData.keywords
      ? formData.keywords.split(',').map(k => k.trim())
      : [];

    try {
      const response = await axios.post(`${backendUrl}/api/notices/generate`, {
        type: formData.type,
        parentId: formData.parentId,
        dateTime: formData.dateTime || 'Upcoming PTM slot',
        keywords: keywordArray
      });
      setNoticeResult(response.data);
    } catch (err) {
      console.error('Error generating notice:', err);
      alert('Failed to generate notice.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCopy = () => {
    if (!noticeResult) return;
    const fullText = `Subject: ${noticeResult.subject}\n\n${noticeResult.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (!formData.parentId || !noticeResult) return;
    
    setSubmitLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/notices/send`, {
        parentId: formData.parentId,
        subject: noticeResult.subject,
        body: noticeResult.body,
        type: formData.type
      });
      
      setSentStatus(true);
      alert(`Notice successfully logged in center communications & emailed to: ${response.data.emailedTo}`);
      setTimeout(() => setSentStatus(false), 4000);
    } catch (err) {
      console.error('Error dispatching notice email:', err);
      alert('Failed to dispatch notice email. Check server logs.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Initializing communication templates...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Notice & Communication Generator</h2>
        <p className="text-slate-400 text-sm mt-1">Generate contextual meeting invites, appreciation messages, or reminder notices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Controls Panel */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800/40 pb-2">Notice Parameters</h3>
          <form onSubmit={handleGenerateNotice} className="space-y-4">
            
            <div>
              <label className="form-label" htmlFor="parentId">Recipient Parent</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <select
                  id="parentId"
                  value={formData.parentId}
                  onChange={handleInputChange}
                  className="form-input pl-10"
                  required
                >
                  <option value="" disabled>-- Select Recipient --</option>
                  {parents.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.childName}) — {p.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="type">Notice Template Type</label>
              <select
                id="type"
                value={formData.type}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="meeting">PTM Invitation Notice</option>
                <option value="appreciation">Appreciation Message</option>
                <option value="warning">Grievance Care Call Notice</option>
                <option value="reminder">Weekly Portal Reminder</option>
              </select>
            </div>

            {formData.type === 'meeting' && (
              <div>
                <label className="form-label" htmlFor="dateTime">PTM Date & Time</label>
                <input
                  id="dateTime"
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            )}

            {(formData.type === 'appreciation' || formData.type === 'warning') && (
              <div>
                <label className="form-label" htmlFor="keywords">Key Topics (Comma separated)</label>
                <input
                  id="keywords"
                  type="text"
                  placeholder="e.g. Bus safety, Food quality"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full btn-primary py-3 mt-4"
            >
              {submitLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Compiling template...</span>
                </>
              ) : (
                <span>Compile Notice</span>
              )}
            </button>
          </form>
        </div>

        {/* Notice Preview Output Panel */}
        <div className="glass-panel p-6 lg:col-span-2 bg-white/95 border-[#E6DDD0] flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#4A433A] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#FF8562]" /> Compiled Notice Preview
            </h3>
            
            {noticeResult ? (
              <div className="space-y-4 animate-fadeIn">
                
                {/* Result header */}
                <div className="p-3 bg-[#FCFAF7] border border-[#E6DDD0] rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Subject Line:</div>
                  <div className="text-xs font-bold text-[#4A433A]">{noticeResult.subject}</div>
                </div>

                {/* Result body */}
                <pre className="p-4 bg-[#FCFAF7] border border-[#E6DDD0] rounded-xl text-xs font-mono text-[#4A433A] leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto">
                  {noticeResult.body}
                </pre>

              </div>
            ) : (
              <div className="border-2 border-dashed border-[#E6DDD0] py-32 text-center rounded-2xl flex flex-col items-center justify-center">
                <Mail className="h-10 w-10 text-[#9E9588] mb-3" />
                <p className="text-slate-550 text-xs max-w-[220px]">
                  Adjust parameters on the left and hit Compile to preview the message template.
                </p>
              </div>
            )}
          </div>

          {noticeResult && (
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#E6DDD0]/60">
              <button
                onClick={handleCopy}
                className="btn-secondary py-2 px-4 text-xs font-bold"
              >
                {copied ? (
                  <>
                    <Check className="h-4.5 w-4.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4.5 w-4.5 text-[#7D7263]" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSend}
                className="btn-primary py-2 px-4 text-xs font-bold"
              >
                {sentStatus ? (
                  <>
                    <Check className="h-4.5 w-4.5 text-emerald-100" />
                    <span>Logged & Emailed!</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4.5 w-4.5" />
                    <span>Dispatch Notification</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
