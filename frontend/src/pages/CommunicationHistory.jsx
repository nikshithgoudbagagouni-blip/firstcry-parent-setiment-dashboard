import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  History, 
  Search, 
  Mail, 
  Layers, 
  Calendar, 
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Loader2,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export default function CommunicationHistory({ backendUrl }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSentiment, setSelectedSentiment] = useState('All');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const [feedbackRes, meetingsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/feedback/list`),
        axios.get(`${backendUrl}/api/meeting/list`)
      ]);

      // Normalize and combine both databases
      const combined = [
        ...feedbackRes.data.map(f => ({
          id: f.id || f._id,
          parentName: f.parentName,
          studentName: f.studentName,
          type: f.type,
          content: f.rawText,
          score: f.sentimentScore,
          label: f.sentimentLabel,
          timestamp: new Date(f.timestamp),
          metadata: f.metadata
        })),
        ...meetingsRes.data.map(m => ({
          id: m.id || m._id,
          parentName: m.parentName,
          studentName: m.studentName,
          type: 'meeting_notes',
          content: `PTM: "${m.title}". Resolution notes: ${m.meetingNotes || 'No notes saved yet.'}`,
          score: m.status === 'Completed' ? 0.3 : -0.2, // simulated sentiment mapping for meetings
          label: m.status === 'Completed' ? 'Positive' : 'Neutral',
          timestamp: new Date(m.dateTime),
          metadata: { status: m.status }
        }))
      ].sort((a, b) => b.timestamp - a.timestamp); // Sorted newest first

      setLogs(combined);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to fetch communications database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-indigo-400" />;
      case 'meeting_notes':
        return <Calendar className="h-4 w-4 text-cyan-400" />;
      case 'survey':
        return <Layers className="h-4 w-4 text-violet-400" />;
      default:
        return <History className="h-4 w-4 text-slate-400" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'All' ? true : log.type === selectedType;
    const matchesSentiment = selectedSentiment === 'All' ? true : log.label === selectedSentiment;

    return matchesSearch && matchesType && matchesSentiment;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Compiling communications database...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Communication History</h2>
          <p className="text-slate-400 text-sm mt-1">Audit log of all parental touchpoints, surveys, emails, and meetings</p>
        </div>
        <button onClick={fetchHistory} className="btn-secondary py-2">
          Sync Database
        </button>
      </div>

      {/* Filter Bar Controls */}
      <div className="glass-panel p-4 bg-[#FCFAF7] border-[#E6DDD0] grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search logs or parents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10 text-sm"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="form-input text-sm"
          >
            <option value="All">All Ingestion Types</option>
            <option value="email">Email Communications</option>
            <option value="survey">Survey Submissions</option>
            <option value="portal_log">Portal Activity Logs</option>
            <option value="rsvp">Event RSVPs</option>
            <option value="meeting_notes">PTM Records</option>
          </select>
        </div>

        <div>
          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value)}
            className="form-input text-sm"
          >
            <option value="All">All Sentiments</option>
            <option value="Positive">Positive Sentiment Only</option>
            <option value="Neutral">Neutral Sentiment Only</option>
            <option value="Negative">Negative Sentiment Only</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs font-semibold text-[#7D7263] pr-2">
          <span>Active Logs: <span className="text-[#FF8562]">{filteredLogs.length} entries</span></span>
        </div>
      </div>

      {/* Timeline List */}
      <div className="glass-panel p-6 shadow-xl">
        <div className="relative border-l border-[#E6DDD0] pl-6 space-y-6 before:absolute before:left-[-1px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#FF8562]/80 before:via-[#88B097]/40 before:to-[#E6DDD0]/10">
          
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Timeline bullet tag */}
                <div className="absolute -left-[38px] top-1.5 h-6 w-6 rounded-full bg-white border border-[#E6DDD0] flex items-center justify-center shadow-lg group-hover:border-[#FF8562]/40 transition-colors">
                  {getIcon(log.type)}
                </div>

                <div className="p-4 bg-[#FCFAF7]/60 border border-[#E6DDD0] hover:border-[#FF8562]/30 rounded-2xl space-y-3 transition duration-200">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-sm text-[#4A433A]">{log.parentName}</h4>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[11px] text-slate-455">Child: <span className="text-[#4A433A] font-semibold">{log.studentName}</span></span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[11px] bg-white px-2.5 py-0.5 rounded-full border border-[#E6DDD0] text-[#7D7263] uppercase font-semibold text-[9px] tracking-wider">
                        {log.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {log.score !== undefined && (
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={`badge-${log.label.toLowerCase()}`}>{log.label}</span>
                          <span className="text-slate-500">({log.score})</span>
                        </div>
                      )}
                      <span className="text-slate-500 font-semibold text-[11px]">
                        {log.timestamp.toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-350 leading-relaxed font-sans">
                    {log.content}
                  </p>

                  {/* Activity Details metadata */}
                  {log.metadata && (log.metadata.portalLogins !== undefined || log.metadata.status) && (
                    <div className="flex flex-wrap items-center gap-4 bg-white/80 border border-[#E6DDD0]/40 p-2 rounded-lg text-[10px] text-[#7D7263] font-semibold uppercase tracking-wide">
                      {log.metadata.portalLogins !== undefined && (
                        <span>Logins: <span className="text-[#88B097]">{log.metadata.portalLogins}</span></span>
                      )}
                      {log.metadata.surveyCompleted !== undefined && (
                        <span>Survey: <span className="text-[#FF8562]">{log.metadata.surveyCompleted ? 'Completed' : 'Skipped'}</span></span>
                      )}
                      {log.metadata.eventAttended !== undefined && (
                        <span>Events: <span className="text-[#8F60A3]">{log.metadata.eventAttended ? 'Attended' : 'Absent'}</span></span>
                      )}
                      {log.metadata.status !== undefined && (
                        <span>Meeting status: <span className="text-[#F57F17]">{log.metadata.status}</span></span>
                      )}
                    </div>
                  )}

                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-slate-500 font-medium text-sm">
              No communication logs match the specified search and filter criteria.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
