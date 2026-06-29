import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Search, Bell, X, LogOut } from 'lucide-react';

export default function HeaderTools({ user, onLogout, setCurrentPage, backendUrl = 'https://firstcry-parent-setiment-dashboard.onrender.com' }) {
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin' || !user?.role;
  const isParent = user?.role === 'parent';

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Real database states
  const [dbFeedbacks, setDbFeedbacks] = useState([]);
  const [dbMeetings, setDbMeetings] = useState([]);
  const [loadingRealData, setLoadingRealData] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const bellRef = useRef(null);
  const profileRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch real data from express backend services
  const fetchRealData = useCallback(async () => {
    setLoadingRealData(true);
    try {
      const [feedbackRes, meetingRes] = await Promise.all([
        axios.get(`${backendUrl}/api/feedback/list`).catch(() => ({ data: [] })),
        axios.get(`${backendUrl}/api/meeting/list`).catch(() => ({ data: [] }))
      ]);

      const feedbacks = feedbackRes.data || [];
      const meetings = meetingRes.data || [];

      setDbFeedbacks(feedbacks);
      setDbMeetings(meetings);

      // Generate dynamic notifications from real database logs!
      const generatedNotifs = [];

      // 1. Populate recent feedback notifications
      feedbacks.slice(0, 5).forEach((f, idx) => {
        let text = "";
        let type = "dashboard";
        if (isAdmin || isTeacher) {
          text = `New feedback from ${f.parentName} (${f.studentName}): "${f.rawText.substring(0, 45)}..."`;
          type = isTeacher ? "communication" : "dashboard";
        } else {
          text = `Your feedback was ingested: "${f.rawText.substring(0, 45)}..."`;
          type = "feedback";
        }

        generatedNotifs.push({
          id: `feedback-${f.id || idx}`,
          text: text,
          time: new Date(f.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          read: f.sentimentLabel !== 'Negative', // Unread if negative sentiment alert
          type: type
        });
      });

      // 2. Populate recent meeting notifications
      meetings.slice(0, 5).forEach((m, idx) => {
        generatedNotifs.push({
          id: `meeting-${m.id || idx}`,
          text: `PTM Meeting Scheduled: "${m.title}" (${m.status})`,
          time: new Date(m.dateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          read: m.status === 'Completed',
          type: isTeacher ? "dashboard" : isParent ? "messages" : "meeting-scheduler"
        });
      });

      setNotifications(generatedNotifs.slice(0, 7));
    } catch (err) {
      console.error("Error fetching real data for header tools:", err);
    } finally {
      setLoadingRealData(false);
    }
  }, [isAdmin, isTeacher, isParent]);

  // Fetch on mount
  useEffect(() => {
    if (user) {
      fetchRealData();
    }
  }, [user, fetchRealData]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when search modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
  }, [isSearchOpen]);

  // Ctrl+K hotkey
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        fetchRealData();
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchRealData]);

  const handleNotificationClick = (n) => {
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    setIsNotificationsOpen(false);
    if (setCurrentPage) {
      setCurrentPage(n.type);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(item => ({ ...item, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Profile details initial
  const userInitial = user?.name ? user.name[0].toUpperCase() : (isAdmin ? 'A' : 'P');

  // Suggested actions
  const suggestedActions = useMemo(() => {
    if (isTeacher) {
      return [
        { label: "Class attendance sheet", page: "attendance", detail: "Mark daily classroom attendance" },
        { label: "Student records directory", page: "students", detail: "Browse Nursery B class profiles" },
        { label: "Parent communication hub", page: "communication", detail: "Chat with student guardians" },
        { label: "Return to home page", page: "dashboard", detail: "Check overall center summary" }
      ];
    }
    if (isParent) {
      return [
        { label: "Aarav's development progress", page: "progress", detail: "View milestones & ratings" },
        { label: "Classroom photo gallery", page: "activities", detail: "Browse latest activity photos" },
        { label: "Message history & inbox", page: "messages", detail: "View communication logs" },
        { label: "Share feedback with school", page: "feedback", detail: "Submit rating and suggestions" }
      ];
    }
    return [
      { label: "Ingest parent feedback form", page: "feedback-form", detail: "Quick input for sentiment sandbox" },
      { label: "Schedule parent-teacher meeting", page: "meeting-scheduler", detail: "Set up proactive reviews" },
      { label: "Manage user account settings", page: "user-management", detail: "View system logins & activities" },
      { label: "Export sentiment reports", page: "reports", detail: "Print CSV summaries of parent mood" }
    ];
  }, [isTeacher, isParent]);

  // Dynamic filter for feedbacks and meetings
  const filteredFeedbacks = useMemo(() => {
    if (!searchQuery) return [];
    return dbFeedbacks.filter(f => 
      f.parentName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.rawText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.extractedKeywords?.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, dbFeedbacks]);

  const filteredMeetings = useMemo(() => {
    if (!searchQuery) return [];
    return dbMeetings.filter(m => 
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.parentName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, dbMeetings]);

  return (
    <div className="flex items-center gap-3 relative">
      
      {/* 1. Search Icon Button */}
      <button 
        onClick={() => {
          setIsSearchOpen(true);
          fetchRealData();
        }}
        className="icon-button cursor-pointer hover:bg-slate-50 transition-colors"
        title="Search portal (Ctrl+K)"
      >
        <Search size={18} />
      </button>

      {/* 2. Notification Bell Button */}
      <div className="relative" ref={bellRef}>
        <button 
          onClick={() => {
            const nextState = !isNotificationsOpen;
            setIsNotificationsOpen(nextState);
            setIsProfileOpen(false);
            if (nextState) {
              fetchRealData();
            }
          }}
          className="icon-button relative cursor-pointer hover:bg-slate-50 transition-colors"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#ff6b57] border-2 border-white animate-pulse" />
          )}
        </button>

        {/* Notifications Dropdown Card */}
        {isNotificationsOpen && (
          <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-xl border border-[#e5e9f2] py-3 z-50">
            <div className="px-4 pb-2 border-b border-[#e5e9f2] flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Notifications</span>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[9px] font-extrabold text-[#155eef] hover:underline cursor-pointer"
                  >
                    Read All
                  </button>
                )}
                <button 
                  onClick={handleClearNotifications}
                  className="text-[9px] font-extrabold text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto mt-2 px-2 space-y-1">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-2.5 rounded-xl text-left cursor-pointer transition-colors ${
                      n.read ? 'hover:bg-slate-50' : 'bg-[#f4f8ff] hover:bg-[#ebf3ff]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                        n.read ? 'bg-transparent' : 'bg-[#155eef]'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 leading-normal break-words">{n.text}</p>
                        <span className="text-[9px] text-[#788299] block mt-1 font-medium">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#788299] font-medium">
                  {loadingRealData ? "Syncing real dashboard data..." : "No notifications to show."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. User Profile Circle */}
      <div className="relative" ref={profileRef}>
        <button 
          onClick={() => {
            setIsProfileOpen(!isProfileOpen);
            setIsNotificationsOpen(false);
          }}
          className="h-10 w-10 rounded-full bg-gradient-to-br from-[#ffd3b9] to-[#f39a7b] border-2 border-white shadow flex items-center justify-center font-bold text-sm text-[#3a2010] cursor-pointer hover:shadow-md transition-all duration-200"
          title="User Profile Menu"
        >
          {userInitial}
        </button>

        {/* Profile Dropdown Card */}
        {isProfileOpen && (
          <div className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl shadow-xl border border-[#e5e9f2] p-4 z-50 text-slate-800">
            <div className="text-center pb-3 border-b border-[#e5e9f2]">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#ffd3b9] to-[#f39a7b] border-2 border-white shadow flex items-center justify-center font-bold text-lg text-[#3a2010] mx-auto mb-2">
                {userInitial}
              </div>
              <h3 className="font-extrabold text-sm text-[#172033] leading-tight">{user?.name || (isTeacher ? 'Class Teacher Priya' : isAdmin ? 'Center Head Administrator' : 'Rahul Sharma')}</h3>
              <p className="text-xs text-[#788299] mt-0.5 break-all">{user?.email || (isTeacher ? 'priya@firstcry.com' : isAdmin ? 'admin@firstcry.com' : 'rahul.sharma@example.com')}</p>
              <span className={`inline-block role-pill ${isTeacher ? 'teacher' : isParent ? 'parent' : 'teacher'} mt-2`}>
                {user?.role || 'admin'} access
              </span>
            </div>

            <div className="py-3 text-xs space-y-2 border-b border-[#e5e9f2]">
              <div className="flex justify-between">
                <span className="text-[#788299] font-semibold uppercase tracking-wider text-[10px]">Session Status</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" /> Active
                </span>
              </div>
              {isTeacher && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#788299] font-semibold uppercase tracking-wider text-[10px]">Assigned Class</span>
                    <span className="text-[#172033] font-bold">{user?.assignedClass || 'Nursery B'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#788299] font-semibold uppercase tracking-wider text-[10px]">Learners</span>
                    <span className="text-[#172033] font-bold">24 active</span>
                  </div>
                </>
              )}
              {isParent && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#788299] font-semibold uppercase tracking-wider text-[10px]">Child Profile</span>
                    <span className="text-[#172033] font-bold">Aarav Sharma</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#788299] font-semibold uppercase tracking-wider text-[10px]">Class/Grade</span>
                    <span className="text-[#172033] font-bold">Playgroup A</span>
                  </div>
                </>
              )}
              {isAdmin && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#788299] font-semibold uppercase tracking-wider text-[10px]">Admin Scope</span>
                    <span className="text-[#172033] font-bold">Full Center Control</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#788299] font-semibold uppercase tracking-wider text-[10px]">Portals Active</span>
                    <span className="text-[#172033] font-bold">All 3 active</span>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 mt-3 px-4 py-2.5 bg-rose-50 hover:bg-rose-150 text-rose-600 rounded-xl transition text-xs font-bold cursor-pointer"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* 4. Spotlight Search Modal Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-start justify-center pt-[10vh] p-4 text-left">
          
          {/* Modal Backdrop Clickout */}
          <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
          
          <div className="bg-white w-full max-w-xl rounded-[22px] shadow-2xl border border-[#e5e9f2] overflow-hidden flex flex-col max-h-[75vh] z-[110] relative text-left">
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e5e9f2]">
              <Search className="text-slate-400 shrink-0" size={20} />
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isTeacher ? "Search student records, wellness status, concerns..." :
                  isParent ? "Search activities, stories, message logs..." :
                  "Search parent records, user accounts, system actions..."
                }
                className="w-full text-slate-800 placeholder-slate-400 outline-none text-sm bg-transparent border-none py-1"
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Results Pane */}
            <div className="overflow-y-auto p-4 flex-1">
              
              {/* Empty query: Show quick navigation shortcuts */}
              {!searchQuery && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Suggested Actions</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {suggestedActions.map((action) => (
                      <button 
                        key={action.page}
                        onClick={() => {
                          setIsSearchOpen(false);
                          if (setCurrentPage) setCurrentPage(action.page);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left transition cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{action.label}</p>
                          <p className="text-[10px] text-[#788299] mt-0.5">{action.detail}</p>
                        </div>
                        <span className="text-[#155eef] font-bold text-[10px]">Open →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtering query */}
              {searchQuery && (
                <div className="space-y-4">
                  
                  {/* Real Feedbacks section */}
                  {filteredFeedbacks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-[#FF8562] uppercase tracking-wider mb-1">Feedback Database</h4>
                      {filteredFeedbacks.map((f) => (
                        <div 
                          key={f.id}
                          className="p-3 border border-[#e5e9f2] rounded-2xl bg-[#FCFAF7] hover:border-[#155eef]/40 transition flex items-center justify-between cursor-pointer"
                          onClick={() => {
                            setIsSearchOpen(false);
                            if (setCurrentPage) setCurrentPage(isTeacher ? 'communication' : isParent ? 'feedback' : 'dashboard');
                          }}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              {f.parentName} <span className="text-[10px] text-slate-400 font-normal">({f.studentName})</span>
                            </p>
                            <p className="text-[10px] text-[#788299] mt-1 italic truncate max-w-[340px]">
                              "{f.rawText}"
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                            f.sentimentLabel === 'Positive' ? 'bg-emerald-50 text-emerald-700' :
                            f.sentimentLabel === 'Negative' ? 'bg-red-50 text-red-650' : 'bg-slate-50 text-slate-600'
                          }`}>
                            {f.sentimentLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Real Meetings section */}
                  {filteredMeetings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-[#88B097] uppercase tracking-wider mb-1">PTM Meetings</h4>
                      {filteredMeetings.map((m) => (
                        <div 
                          key={m.id}
                          className="p-3 border border-[#e5e9f2] rounded-2xl bg-[#FCFAF7] hover:border-[#155eef]/40 transition flex items-center justify-between cursor-pointer"
                          onClick={() => {
                            setIsSearchOpen(false);
                            if (setCurrentPage) setCurrentPage(isParent ? 'messages' : 'meeting-scheduler');
                          }}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">{m.title}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Date: {new Date(m.dateTime).toLocaleDateString()}</p>
                          </div>
                          <span className="text-[10px] font-extrabold text-[#155eef] bg-[#eef4ff] px-2 py-0.5 rounded-md">
                            {m.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fallback if no matching feedbacks or meetings */}
                  {filteredFeedbacks.length === 0 && filteredMeetings.length === 0 && (
                    <div className="text-center py-10 text-xs text-[#788299]">
                      No database records or meetings found matching "{searchQuery}"
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Keyboard hint footer */}
            <div className="bg-slate-50 px-4 py-2.5 text-[9px] text-[#788299] font-medium flex justify-between items-center border-t border-[#e5e9f2]">
              <span>Press <kbd className="bg-white border border-slate-200 px-1 py-0.5 rounded shadow-xs font-bold">Esc</kbd> to close</span>
              <span>Real data fetched directly from Express API</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
