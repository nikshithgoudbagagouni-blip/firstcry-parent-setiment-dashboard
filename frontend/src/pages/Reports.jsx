import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  Smile, 
  Meh, 
  Frown, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function Reports({ backendUrl }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReportData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${backendUrl}/api/report`);
      setReport(response.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to generate report summaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleExportCSV = () => {
    // Redirects browser to trigger native file attachment download
    window.open(`${backendUrl}/api/report?format=csv`, '_blank');
  };

  const handleExportPDF = () => {
    // Print styling fallback trigger
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Compiling summary reports database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="glass-panel p-6 text-center max-w-sm border-rose-500/20">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-sm text-slate-300 mb-4">{error}</p>
          <button onClick={fetchReportData} className="btn-primary w-full">
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    totalParents = 0,
    totalFeedback = 0,
    sentimentCounts = { positive: 0, negative: 0, neutral: 0 },
    sentimentRatios = { positivePercent: 0, negativePercent: 0, neutralPercent: 0 },
    topKeywords = [],
    atRiskParents = [],
    meetings = []
  } = report || {};

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto printable-area">
      
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 no-print">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Reports Console</h2>
          <p className="text-slate-400 text-sm mt-1">Export structured spreadsheet archives or compile print-ready PDFs</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV} 
            className="btn-secondary py-2 text-xs font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-450" />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={handleExportPDF} 
            className="btn-primary py-2 text-xs font-semibold"
          >
            <Download className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Aggregated distribution card */}
        <div className="glass-panel p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white mb-2">Sentiment Breakdown</h3>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-[#FCFAF7] rounded-xl border border-[#E6DDD0]">
              <Smile className="h-5 w-5 text-emerald-450 mx-auto mb-1.5" />
              <div className="text-xl font-extrabold text-[#4A433A]">{sentimentCounts.positive}</div>
              <span className="text-[9px] text-[#7D7263] font-bold uppercase">Positive</span>
            </div>
            <div className="p-3 bg-[#FCFAF7] rounded-xl border border-[#E6DDD0]">
              <Meh className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
              <div className="text-xl font-extrabold text-[#4A433A]">{sentimentCounts.neutral}</div>
              <span className="text-[9px] text-[#7D7263] font-bold uppercase">Neutral</span>
            </div>
            <div className="p-3 bg-[#FCFAF7] rounded-xl border border-[#E6DDD0]">
              <Frown className="h-5 w-5 text-rose-450 mx-auto mb-1.5" />
              <div className="text-xl font-extrabold text-[#4A433A]">{sentimentCounts.negative}</div>
              <span className="text-[9px] text-[#7D7263] font-bold uppercase">Negative</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#E6DDD0]/60">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[#7D7263]">
                <span>Positive Sentiment</span>
                <span className="text-emerald-600">{sentimentRatios.positivePercent}%</span>
              </div>
              <div className="w-full bg-[#FCFAF7] border border-[#E6DDD0]/40 rounded-full h-2">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${sentimentRatios.positivePercent}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[#7D7263]">
                <span>Neutral Feedback</span>
                <span className="text-[#7D7263]">{sentimentRatios.neutralPercent}%</span>
              </div>
              <div className="w-full bg-[#FCFAF7] border border-[#E6DDD0]/40 rounded-full h-2">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: `${sentimentRatios.neutralPercent}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[#7D7263]">
                <span>Negative Concerns</span>
                <span className="text-rose-600">{sentimentRatios.negativePercent}%</span>
              </div>
              <div className="w-full bg-[#FCFAF7] border border-[#E6DDD0]/40 rounded-full h-2">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${sentimentRatios.negativePercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Keywords extracted summary list */}
        <div className="glass-panel p-6 shadow-xl space-y-4 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-2">Extracted Issues Index</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topKeywords.length > 0 ? (
              topKeywords.slice(0, 8).map((kw, i) => (
                <div key={kw.keyword} className="flex justify-between items-center p-3 bg-[#FCFAF7] border border-[#E6DDD0] rounded-xl text-xs font-semibold">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-md bg-[#FF8562]/10 text-[#FF8562] flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="text-[#4A433A]">{kw.keyword}</span>
                  </div>
                  <span className="text-[#7D7263] font-bold bg-white px-2 py-0.5 rounded border border-[#E6DDD0]">
                    {kw.count} occurrences
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs col-span-2 py-8 text-center">No keywords parsed yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Directory listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* At risk parents directory */}
        <div className="glass-panel p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">At-Risk Parents Registry</h3>
          <div className="overflow-y-auto max-h-[300px] pr-1 space-y-3">
            {atRiskParents.length > 0 ? (
              atRiskParents.map((p, idx) => (
                <div key={idx} className="p-3.5 bg-[#FCFAF7] border border-[#E6DDD0] rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-[#4A433A]">{p.name}</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">Child: {p.studentName} | Grade: {p.classGrade}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{p.email} | {p.phone}</p>
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    At-Risk
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs py-12 text-center">All parent records are stable.</p>
            )}
          </div>
        </div>

        {/* Scheduled meetings history summaries */}
        <div className="glass-panel p-6 shadow-xl">
          <h3 className="text-lg font-bold text-[#4A433A] mb-4">Logged PTM Schedules</h3>
          <div className="overflow-y-auto max-h-[300px] pr-1 space-y-3">
            {meetings.length > 0 ? (
              meetings.map((m, idx) => (
                <div key={idx} className="p-3.5 bg-[#FCFAF7] border border-[#E6DDD0] rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-[#4A433A]">{m.title}</h4>
                    <p className="text-[10px] text-slate-455 mt-0.5">Parent: {m.parent}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Date: {new Date(m.date).toLocaleDateString()} at {new Date(m.date).toLocaleTimeString(undefined, { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    m.status === 'Completed' 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-250' 
                      : 'bg-amber-500/10 text-amber-600 border-amber-250'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs py-12 text-center">No meetings logged.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
