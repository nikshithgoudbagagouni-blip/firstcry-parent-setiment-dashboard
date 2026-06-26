import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  Mail, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function MeetingScheduler({ backendUrl, preselectedParentId }) {
  const [meetings, setMeetings] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    parentId: '',
    title: '',
    description: '',
    dateTime: ''
  });

  const [filterStatus, setFilterStatus] = useState('All');
  const [activeNotesId, setActiveNotesId] = useState(null);
  const [notesText, setNotesText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingsRes, parentsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/meeting/list`),
        axios.get(`${backendUrl}/api/feedback/list`) // Using list feedback to extract parents
      ]);
      setMeetings(meetingsRes.data);
      
      // Extract unique parent objects
      const uniqueParents = [];
      const parentIds = new Set();
      
      parentsRes.data.forEach(item => {
        if (item.email && !parentIds.has(item.email)) {
          parentIds.add(item.email);
          uniqueParents.push({
            id: item.parentId?._id || item.parentId || item.id, // Handles both formats
            name: item.parentName,
            childName: item.studentName
          });
        }
      });
      setParents(uniqueParents);

      // Handle redirect hook pre-selections
      if (preselectedParentId) {
        const found = uniqueParents.find(p => p.id === preselectedParentId);
        if (found) {
          setFormData(prev => ({ ...prev, parentId: found.id }));
        }
      } else if (uniqueParents.length > 0) {
        setFormData(prev => ({ ...prev, parentId: uniqueParents[0].id }));
      }

    } catch (err) {
      console.error('Error fetching scheduler data:', err);
      setError('Failed to fetch schedule records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [preselectedParentId]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.parentId || !formData.title || !formData.dateTime) {
      alert('Please fill out all scheduling fields.');
      return;
    }

    setSubmitLoading(true);
    try {
      await axios.post(`${backendUrl}/api/meeting/create`, formData);
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        dateTime: ''
      }));
      fetchData(); // Refresh logs
    } catch (err) {
      console.error('Error creating meeting:', err);
      alert('Failed to schedule meeting. Check service logs.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${backendUrl}/api/meeting/${id}`, { status });
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleSendReminder = async (meeting) => {
    try {
      // Send API update for status reminder flag
      await axios.put(`${backendUrl}/api/meeting/${meeting.id}`, { reminderSent: true });
      // Call notice generator API
      await axios.post(`${backendUrl}/api/notices/generate`, {
        type: 'meeting',
        parentId: meeting.parentId,
        dateTime: new Date(meeting.dateTime).toLocaleString()
      });
      alert(`Reminder generated and logged for ${meeting.parentName}!`);
      fetchData();
    } catch (err) {
      console.error('Error sending reminder notice:', err);
      alert('Failed to log reminder notice.');
    }
  };

  const handleSaveNotes = async (id) => {
    try {
      await axios.put(`${backendUrl}/api/meeting/${id}`, { meetingNotes: notesText });
      setActiveNotesId(null);
      setNotesText('');
      fetchData();
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  const filteredMeetings = meetings.filter(m => 
    filterStatus === 'All' ? true : m.status === filterStatus
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Loading upcoming schedules...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Parent Meeting Scheduler</h2>
        <p className="text-slate-400 text-sm mt-1">Organize PTMs, coordinate alerts, and log meeting discussion resolutions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Scheduler Form Panel */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800/40 pb-2">Plan New Meeting</h3>
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            
            <div>
              <label className="form-label" htmlFor="parentId">Select Parent Profile</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <select
                  id="parentId"
                  value={formData.parentId}
                  onChange={handleInputChange}
                  className="form-input pl-10"
                  required
                >
                  <option value="" disabled>-- Select Parent --</option>
                  {parents.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.childName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="title">Meeting Title</label>
              <input
                id="title"
                type="text"
                placeholder="Bus route delay grievances"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label" htmlFor="dateTime">Meeting Date & Time</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  id="dateTime"
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={handleInputChange}
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="description">Discussion Agenda</label>
              <textarea
                id="description"
                rows="3"
                placeholder="Briefly state key topics to cover..."
                value={formData.description}
                onChange={handleInputChange}
                className="form-input resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full btn-primary py-3"
            >
              {submitLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Scheduling meeting...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Confirm Schedule</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Schedule Listing Panel */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Upcoming & Historical Meetings</h3>
              <div className="flex gap-1 bg-[#FCFAF7] p-1 border border-[#E6DDD0] rounded-lg text-xs">
                {['All', 'Scheduled', 'Completed', 'Cancelled'].map(st => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                      filterStatus === st 
                        ? 'bg-[#FF8562] text-white shadow' 
                        : 'text-[#7D7263] hover:text-[#4A433A]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {filteredMeetings.length > 0 ? (
                filteredMeetings.map(meeting => (
                  <div 
                    key={meeting.id} 
                    className="p-4 bg-[#FCFAF7]/60 border border-[#E6DDD0] rounded-xl space-y-3 shadow-sm hover:border-[#FF8562]/35 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-[#4A433A]">{meeting.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Parent: <span className="font-semibold text-[#4A433A]">{meeting.parentName}</span> ({meeting.studentName})
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 font-bold rounded-md border ${
                        meeting.status === 'Completed' ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' :
                        meeting.status === 'Cancelled' ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]' :
                        'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082] animate-pulse'
                      }`}>
                        {meeting.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#7D7263] leading-relaxed bg-white/70 border border-[#E6DDD0]/40 p-2.5 rounded-lg font-semibold">
                      {meeting.description || 'No description provided.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          {new Date(meeting.dateTime).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-cyan-400" />
                          {new Date(meeting.dateTime).toLocaleTimeString(undefined, { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        {meeting.status === 'Scheduled' && (
                          <>
                            <button
                              onClick={() => handleSendReminder(meeting)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                                meeting.reminderSent 
                                  ? 'bg-[#E5EFEA] text-[#426453] border-[#CBDCD2]' 
                                  : 'bg-[#FF8562]/10 text-[#FF8562] border-[#FF8562]/20 hover:bg-[#FF8562]/20'
                              }`}
                            >
                              <Mail className="h-3 w-3" /> {meeting.reminderSent ? 'Reminder Sent' : 'Send Reminder'}
                            </button>
                            <button
                              onClick={() => updateStatus(meeting.id, 'Completed')}
                              className="p-1 hover:text-emerald-605 bg-white hover:bg-emerald-50 border border-[#E6DDD0] rounded-md transition cursor-pointer text-[#7D7263]"
                              title="Mark Completed"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => updateStatus(meeting.id, 'Cancelled')}
                              className="p-1 hover:text-rose-605 bg-white hover:bg-rose-50 border border-[#E6DDD0] rounded-md transition cursor-pointer text-[#7D7263]"
                              title="Cancel Meeting"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {meeting.status === 'Completed' && (
                          <button
                            onClick={() => {
                              setActiveNotesId(meeting.id);
                              setNotesText(meeting.meetingNotes || '');
                            }}
                            className="text-[10px] font-bold bg-white hover:bg-[#FAF7F2] text-[#7D7263] px-2 py-1 border border-[#E6DDD0] rounded-md transition cursor-pointer"
                          >
                            {meeting.meetingNotes ? 'Edit Notes' : 'Add Notes'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expand Notes Panel */}
                    {activeNotesId === meeting.id && (
                      <div className="p-3 bg-white rounded-xl border border-[#E6DDD0] mt-2 space-y-3">
                        <label className="text-xs font-bold text-[#6B6152] block">PTM Summary & Outcome Notes</label>
                        <textarea
                          rows="3"
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          className="form-input text-xs"
                          placeholder="Type notes discussed (e.g., Parent is satisfied with adjustments. We will check in again...)"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setActiveNotesId(null)}
                            className="px-3 py-1 bg-white hover:bg-[#FAF7F2] rounded-md text-[10px] font-semibold text-[#7D7263] border border-[#E6DDD0] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNotes(meeting.id)}
                            className="btn-primary py-1 px-3 rounded-md text-[10px] font-semibold text-white flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="h-3 w-3" /> Save Summary
                          </button>
                        </div>
                      </div>
                    )}

                    {meeting.meetingNotes && activeNotesId !== meeting.id && (
                      <div className="p-2.5 bg-[#FF8562]/5 border border-[#FF8562]/10 rounded-lg text-xs">
                        <span className="font-bold text-[10px] text-[#FF8562] block mb-0.5">PTM Outcome:</span>
                        <p className="text-[#4A433A] italic font-semibold">{meeting.meetingNotes}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-16 text-sm">No scheduled meetings matches filter.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
