import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, 
  User, 
  Baby, 
  Mail, 
  Phone, 
  GraduationCap, 
  Activity, 
  Smile, 
  Calendar, 
  Loader2, 
  AlertCircle,
  Clock,
  Sparkles,
  MessageSquare
} from 'lucide-react';

export default function FeedbackDetail({ parentId, onBack, backendUrl }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetailData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${backendUrl}/api/feedback/${parentId}/detail`);
      setDetail(response.data);
    } catch (err) {
      console.error('Error fetching parent detail details:', err);
      setError('Failed to fetch the parent history records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (parentId) {
      fetchDetailData();
    }
  }, [parentId]);

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-10 w-10 text-[#FF8562] animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Aggregating historical records...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="glass-panel p-6 text-center max-w-sm border-rose-500/20">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-sm text-slate-300 mb-4">{error || 'Record details not found.'}</p>
          <button onClick={onBack} className="btn-primary w-full">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { parent, interactions = [], meetings = [] } = detail;

  // Calculate parent's individual average sentiment
  const totalFeedback = interactions.length;
  const sumSentiment = interactions.reduce((acc, i) => acc + (i.sentimentScore || 0), 0);
  const avgSentiment = totalFeedback > 0 ? parseFloat((sumSentiment / totalFeedback).toFixed(2)) : 0;

  // Calculate parent's latest engagement index based on metadata
  let latestEngagement = 50;
  if (interactions.length > 0) {
    const latest = interactions[0];
    const lPts = Math.min((latest.metadata?.portalLogins || 0) * 5, 30);
    const sPts = latest.metadata?.surveyCompleted ? 35 : 0;
    const ePts = latest.metadata?.eventAttended ? 35 : 0;
    latestEngagement = lPts + sPts + ePts;
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Back Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2.5 bg-white border border-[#E6DDD0] text-[#7D7263] hover:text-[#FF8562] hover:bg-[#FAF7F2] rounded-xl transition duration-150 cursor-pointer shadow-sm"
          title="Back to Overview"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-[#4A433A] tracking-tight">Parent Details File</h2>
          <p className="text-slate-400 text-sm mt-1">Aggregated historical record of parent interactions, sentiment analysis, and meetings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Parent Profile Summary */}
        <div className="space-y-6 lg:col-span-1">
          <div className="glass-panel p-6 space-y-6">
            <h3 className="text-lg font-bold text-[#4A433A] border-b border-[#E6DDD0]/40 pb-2 flex items-center gap-2">
              <User className="h-5 w-5 text-[#FF8562]" /> Parent Profile
            </h3>

            {/* Profile Avatar Card */}
            <div className="flex flex-col items-center text-center space-y-3 py-2">
              <div className="h-20 w-20 rounded-full bg-[#FF8562]/10 border border-[#FF8562]/20 flex items-center justify-center font-black text-2xl text-[#FF8562] shadow-sm">
                {parent.name ? parent.name[0] : 'P'}
              </div>
              <div>
                <h4 className="font-extrabold text-lg text-[#4A433A]">{parent.name}</h4>
                <span className={`badge-${parent.admissionStatus === 'At-Risk' ? 'negative animate-pulse' : 'positive'} mt-1.5 inline-block`}>
                  {parent.admissionStatus}
                </span>
              </div>
            </div>

            {/* Structured details */}
            <div className="space-y-4 pt-4 border-t border-[#E6DDD0]/40 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-450 font-bold uppercase tracking-wider">Student ID</span>
                <span className="font-bold text-[#4A433A] bg-[#FCFAF7] border border-[#E6DDD0] px-2 py-0.5 rounded">
                  {parent.studentId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450 font-bold uppercase tracking-wider">Child Name</span>
                <span className="font-semibold text-[#4A433A] flex items-center gap-1">
                  <Baby className="h-3.5 w-3.5 text-[#FF8562]" /> {parent.studentName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450 font-bold uppercase tracking-wider">Class/Grade</span>
                <span className="font-semibold text-[#4A433A]">{parent.classGrade}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450 font-bold uppercase tracking-wider">Email</span>
                <span className="font-semibold text-[#4A433A] flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-[#88B097]" /> {parent.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450 font-bold uppercase tracking-wider">Contact</span>
                <span className="font-semibold text-[#4A433A] flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-[#88B097]" /> {parent.phone}
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E6DDD0]/40 text-center">
              <div className="p-3 bg-[#FCFAF7] border border-[#E6DDD0] rounded-2xl">
                <Smile className="h-4.5 w-4.5 text-[#FF8562] mx-auto mb-1" />
                <div className="text-lg font-bold text-[#4A433A]">{avgSentiment > 0 ? '+' : ''}{avgSentiment}</div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Avg Sentiment</span>
              </div>
              <div className="p-3 bg-[#FCFAF7] border border-[#E6DDD0] rounded-2xl">
                <Activity className="h-4.5 w-4.5 text-[#88B097] mx-auto mb-1" />
                <div className="text-lg font-bold text-[#4A433A]">{latestEngagement}/100</div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Engagement</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Columns: Feedbacks & Meetings Timeline Lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Feedbacks Panel */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-[#4A433A] mb-4 border-b border-[#E6DDD0]/40 pb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#FF8562]" /> Communication History
            </h3>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {interactions.length > 0 ? (
                interactions.map(item => (
                  <div key={item._id || item.id} className="p-3.5 bg-[#FCFAF7] border border-[#E6DDD0] rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] bg-white border border-[#E6DDD0] text-[#7D7263] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                        {item.type}
                      </span>
                      <div className="flex items-center gap-2 font-bold">
                        <span className={`badge-${item.sentimentLabel.toLowerCase()}`}>{item.sentimentLabel}</span>
                        <span className="text-slate-550">({item.sentimentScore})</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-350 leading-relaxed font-sans">{item.rawText}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold pt-1 border-t border-[#E6DDD0]/20">
                      <span>Rating: {item.rating} Stars</span>
                      <span>{new Date(item.timestamp).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">No feedback records found.</div>
              )}
            </div>
          </div>

          {/* Meetings Panel */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-[#4A433A] mb-4 border-b border-[#E6DDD0]/40 pb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#FF8562]" /> Scheduled PTM Meetings
            </h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {meetings.length > 0 ? (
                meetings.map(meeting => (
                  <div key={meeting._id || meeting.id} className="p-3.5 bg-[#FCFAF7] border border-[#E6DDD0] rounded-2xl space-y-2.5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-105">{meeting.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        meeting.status === 'Completed' ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' :
                        meeting.status === 'Cancelled' ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]' :
                        'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]'
                      }`}>
                        {meeting.status}
                      </span>
                    </div>
                    {meeting.description && (
                      <p className="text-xs text-slate-350 leading-relaxed font-sans">{meeting.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-0.5"><Calendar className="h-3.5 w-3.5" /> {new Date(meeting.dateTime).toLocaleDateString()}</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-3.5 w-3.5" /> {new Date(meeting.dateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {meeting.meetingNotes && (
                      <div className="p-2.5 bg-[#FF8562]/5 border border-[#FF8562]/10 rounded-xl text-xs">
                        <span className="font-bold text-[10px] text-[#FF8562] block mb-0.5">PTM Outcomes:</span>
                        <p className="text-[#4A433A] italic font-semibold">{meeting.meetingNotes}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">No PTM meetings scheduled.</div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
