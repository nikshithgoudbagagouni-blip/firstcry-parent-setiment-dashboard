import React, { useCallback, useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Users, ClipboardCheck, MessageCircle, CalendarDays, ArrowUpRight, CheckCircle2, Star, BookOpen, Send, ChevronRight, Heart, Camera, Award, UserCheck, CircleAlert } from 'lucide-react';

const students = [
  { name:'Aarav Sharma', initials:'AS', age:'4y 2m', attendance:96, progress:88, status:'Thriving', color:'#eaf2ff' },
  { name:'Diya Patel', initials:'DP', age:'4y 5m', attendance:92, progress:81, status:'On track', color:'#fff1e8' },
  { name:'Ishaan Gupta', initials:'IG', age:'3y 11m', attendance:98, progress:91, status:'Thriving', color:'#ebf8f1' },
  { name:'Vihaan Reddy', initials:'VR', age:'4y 1m', attendance:84, progress:68, status:'Needs support', color:'#fff2f2' },
  { name:'Aanya Kumar', initials:'AK', age:'4y 3m', attendance:94, progress:84, status:'On track', color:'#f1edff' }
];

import HeaderTools from '../components/HeaderTools';

function Header({ eyebrow, title, subtitle, user, onLogout, setCurrentPage, backendUrl }) {
  return (
    <header className="flex items-start justify-between gap-5 mb-8 relative">
      <div>
        <p className="text-xs font-extrabold tracking-[.14em] text-[#155eef] uppercase">{eyebrow}</p>
        <h2 className="text-3xl font-extrabold text-[#172033] mt-1">{title}</h2>
        <p className="text-sm text-[#788299] mt-1">{subtitle}</p>
      </div>
      <HeaderTools user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} backendUrl={backendUrl} />
    </header>
  );
}

function Metric({ icon:Icon, label, value, hint, tone='blue' }) {
  const tones = { blue:'bg-[#eaf1ff] text-[#155eef]', green:'bg-[#e9f8f0] text-[#16855b]', orange:'bg-[#fff2e9] text-[#e56b2e]', purple:'bg-[#f1edff] text-[#7255d8]' };
  return <div className="portal-card p-5"><div className={`h-10 w-10 rounded-xl ${tones[tone]} flex items-center justify-center`}><Icon size={20}/></div><p className="text-xs font-semibold text-[#7b8499] mt-5">{label}</p><div className="flex items-end justify-between mt-1"><b className="text-2xl text-[#172033]">{value}</b><span className="text-[10px] font-bold text-[#16855b]">{hint}</span></div></div>;
}

function StatusPill({ children, danger=false }) { return <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${danger?'bg-red-50 text-red-600':'bg-emerald-50 text-emerald-700'}`}>{children}</span>; }

export function TeacherPortal({ page, setCurrentPage, user, onLogout, backendUrl, token }) {
  const [query, setQuery] = useState('');
  const [dbStudents, setDbStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({});

  // Teacher feedback on child state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [teacherFbText, setTeacherFbText] = useState('');
  const [teacherRating, setTeacherRating] = useState(5);
  const [teacherCategory, setTeacherCategory] = useState('Communication');
  const [teacherFbSent, setTeacherFbSent] = useState(false);
  const [submittingFb, setSubmittingFb] = useState(false);

  // Real-time Chat States
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [sendingChat, setSendingChat] = useState(false);

  useEffect(() => {
    if (dbStudents.length > 0 && !selectedStudent) {
      setSelectedStudent(dbStudents[0].name);
    }
  }, [dbStudents, selectedStudent]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const [parentsRes, feedbackRes] = await Promise.all([
          axios.get(`${backendUrl}/api/feedback/parents`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${backendUrl}/api/feedback/list`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        const feedbackList = feedbackRes.data;
        setAllFeedbacks(feedbackList);
        const unique = [];
        
        parentsRes.data.forEach(p => {
          const latestFb = feedbackList.find(f => f.studentName.toLowerCase() === p.studentName.toLowerCase());
          
          let status = 'On track';
          let rating = 3;
          let sentimentScore = 0;
          let rawText = '';
          
          if (latestFb) {
            rating = latestFb.rating;
            sentimentScore = latestFb.sentimentScore;
            rawText = latestFb.rawText;
            if (latestFb.sentimentLabel === 'Negative') status = 'Needs support';
            else if (latestFb.sentimentLabel === 'Positive' && latestFb.rating >= 4) status = 'Thriving';
          }

          unique.push({
            name: p.studentName,
            parentName: p.parentName,
            initials: p.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
            age: '4y ' + (Math.floor(Math.random() * 8) + 1) + 'm',
            attendance: Math.round(90 + (sentimentScore + 1) * 5),
            progress: Math.round(75 + (rating * 4) + (Math.random() * 5)),
            status: status,
            color: ['#eaf2ff', '#fff1e8', '#ebf8f1', '#fff2f2', '#f1edff'][unique.length % 5],
            email: p.email,
            latestFeedback: rawText
          });
        });
        
        if (unique.length === 0) {
          setDbStudents(students);
          setAttendance(Object.fromEntries(students.map(s => [s.name, true])));
        } else {
          setDbStudents(unique);
          setAttendance(Object.fromEntries(unique.map(s => [s.name, true])));
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setDbStudents(students);
        setAttendance(Object.fromEntries(students.map(s => [s.name, true])));
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filtered = useMemo(() => {
    return dbStudents.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, dbStudents]);

  const activeStudent = dbStudents[activeStudentIndex] || dbStudents[0];

  const chatMessages = useMemo(() => {
    if (!activeStudent) return [];
    return allFeedbacks
      .filter(f => f.studentName.toLowerCase() === activeStudent.name.toLowerCase())
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [allFeedbacks, activeStudent]);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !activeStudent) return;
    setSendingChat(true);
    try {
      const payload = {
        parentName: activeStudent.parentName,
        childName: activeStudent.name,
        email: activeStudent.email,
        contactNumber: '+91 99999 88888',
        message: chatInput,
        rating: 5,
        category: 'Communication',
        type: 'learning_story',
        portalLogins: 1,
        surveyCompleted: true,
        eventAttended: false
      };
      
      const res = await axios.post(`${backendUrl}/api/feedback/create`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newMsg = {
        id: res.data.interaction?.id || `msg_${Date.now()}`,
        studentName: activeStudent.name,
        parentName: activeStudent.parentName,
        email: activeStudent.email,
        type: 'learning_story',
        rawText: chatInput,
        timestamp: new Date().toISOString()
      };
      setAllFeedbacks(prev => [...prev, newMsg]);
      setChatInput('');
    } catch (err) {
      console.error('Error sending chat message:', err);
      alert('Failed to send message.');
    } finally {
      setSendingChat(false);
    }
  };

  if (loading) {
    return (
      <PortalShell>
        <Header eyebrow="Teacher portal" title="Loading Workspace..." subtitle="Connecting to Center database" user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} />
        <div className="portal-card p-12 text-center text-slate-500 font-medium">
          Loading live Nursery B student roster and portal communications...
        </div>
      </PortalShell>
    );
  }

  const activeStudentsCount = dbStudents.length;
  const presentCount = Object.values(attendance).filter(Boolean).length;
  const attendanceRate = activeStudentsCount > 0 ? Math.round((presentCount / activeStudentsCount) * 100) : 100;

  if (page === 'students') return <PortalShell><Header eyebrow="Teacher portal" title="Student records" subtitle={`Nursery B · ${activeStudentsCount} learners · Academic year 2026`} user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} /><div className="portal-card overflow-hidden"><div className="p-5 border-b border-[#e8ebf2] flex gap-3 justify-between"><div><h3 className="font-extrabold">Class directory</h3><p className="text-xs text-[#8790a3] mt-1">Learning and wellbeing at a glance</p></div><div className="relative"><Search size={15} className="absolute left-3 top-3 text-[#8790a3]"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a student" className="pl-9 pr-4 py-2.5 border border-[#dfe4ed] rounded-xl text-sm outline-none focus:border-[#155eef]"/></div></div><StudentTable students={filtered} onSelectStudent={setSelectedStudentDetail}/></div></PortalShell>;

  if (page === 'attendance') return <PortalShell><Header eyebrow="Teacher portal" title="Morning attendance" subtitle="Saturday, 28 June · Nursery B" user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} /><div className="grid lg:grid-cols-[1fr_320px] gap-6"><div className="portal-card p-6"><div className="flex justify-between mb-5"><div><h3 className="font-extrabold">Mark attendance</h3><p className="text-xs text-[#8790a3] mt-1">Tap a learner to update today’s status</p></div><StatusPill>{presentCount}/{activeStudentsCount} present</StatusPill></div><div className="space-y-2">{dbStudents.map(s=><button key={s.name} onClick={()=>setAttendance(a=>({...a,[s.name]:!a[s.name]}))} className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#e8ebf2] hover:bg-[#f8faff]"><div className="flex items-center gap-3"><Avatar student={s}/><div className="text-left"><p className="text-sm font-bold">{s.name}</p><p className="text-[10px] text-[#8b94a7]">Nursery B</p></div></div>{attendance[s.name]?<span className="flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={16}/> Present</span>:<span className="flex items-center gap-1 text-xs font-bold text-red-600"><CircleAlert size={16}/> Absent</span>}</button>)}</div></div><div className="portal-card p-6 h-fit"><div className="h-12 w-12 bg-[#eaf1ff] text-[#155eef] rounded-2xl flex items-center justify-center"><ClipboardCheck/></div><h3 className="font-extrabold mt-5">Ready to submit?</h3><p className="text-xs text-[#7d879b] mt-2 leading-relaxed">You can still edit attendance until 10:30 AM.</p><button className="btn-primary w-full mt-6" onClick={()=>alert('Attendance submitted successfully')}>Submit attendance</button></div></div></PortalShell>;

  if (page === 'communication') {
    return (
      <PortalShell>
        <Header eyebrow="Teacher portal" title="Parent messages" subtitle="Keep every family close to the classroom" user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} />
        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          
          <div className="portal-card p-5">
            <h3 className="font-extrabold mb-4">Recent conversations</h3>
            <div className="space-y-1">
              {dbStudents.map((s, i) => {
                const isActive = i === activeStudentIndex;
                const studentFbs = allFeedbacks.filter(f => f.studentName.toLowerCase() === s.name.toLowerCase());
                const latestFb = studentFbs[studentFbs.length - 1];
                return (
                  <button 
                    key={s.name} 
                    onClick={() => { setActiveStudentIndex(i); setSent(false); }} 
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition hover:bg-[#f7f9fd] text-left ${isActive ? 'bg-[#eef4ff] border-l-4 border-[#155eef]' : 'border-l-4 border-transparent'}`}
                  >
                    <Avatar student={s} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{s.name.split(' ')[0]}’s family</p>
                      <p className="text-[10px] text-[#8a93a5] truncate">
                        {latestFb ? latestFb.rawText : 'Tap to start conversation'}
                      </p>
                    </div>
                    <span className="ml-auto text-[9px] text-[#9ca4b5]">1h</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="portal-card min-h-[480px] flex flex-col">
            {activeStudent ? (
              <>
                <div className="p-5 border-b border-[#e7eaf1] flex items-center gap-3">
                  <Avatar student={activeStudent} />
                  <div>
                    <p className="font-bold text-sm">{activeStudent.name.split(' ')[0]}’s family</p>
                    <p className="text-[10px] text-emerald-600">Active today</p>
                  </div>
                </div>

                <div className="flex-grow p-6 space-y-4 bg-[#fafbfe] overflow-y-auto max-h-[350px]">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-12">
                      No message history yet. Write an update below to start the conversation!
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => {
                      const isTeacher = msg.type === 'learning_story';
                      return (
                        <div key={msg.id || i} className={`chat-bubble ${isTeacher ? 'own' : ''}`}>
                          <p className="text-[9px] font-bold text-slate-450 mb-1">
                            {isTeacher ? "Priya Ma'am (Teacher)" : `${activeStudent.parentName} (Parent)`}
                          </p>
                          <p className="text-xs leading-relaxed">{msg.rawText}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 flex gap-3 border-t border-[#e7eaf1]">
                  <input 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    onKeyDown={e => { if (e.key === 'Enter') handleSendChatMessage(); }}
                    placeholder="Write a warm update…" 
                    className="form-input text-xs"
                    disabled={sendingChat}
                  />
                  <button 
                    onClick={handleSendChatMessage} 
                    disabled={sendingChat || !chatInput.trim()} 
                    className="h-12 w-12 shrink-0 rounded-xl bg-[#155eef] text-white flex items-center justify-center transition disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-slate-400 text-sm">
                No active student selected
              </div>
            )}
          </div>

        </div>
      </PortalShell>
    );
  }

  if (page === 'feedback') return (
    <PortalShell>
      <Header eyebrow="Teacher portal" title="Share child updates" subtitle="Publish learning stories and wellness updates directly to parent portals" user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} />
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="portal-card p-7 space-y-6">
          <div>
            <label className="block text-xs font-bold text-[#838fa6] uppercase mb-2">Select Student</label>
            <select value={selectedStudent} onChange={e => { setSelectedStudent(e.target.value); setTeacherFbSent(false); }} className="form-input">
              {dbStudents.map(s => <option key={s.name} value={s.name}>{s.name} ({s.parentName}'s child)</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#838fa6] uppercase mb-2">Development Focus Category</label>
              <select value={teacherCategory} onChange={e => setTeacherCategory(e.target.value)} className="form-input">
                <option value="Communication">Communication & Language</option>
                <option value="Social confidence">Social Confidence</option>
                <option value="Creative expression">Creative Expression</option>
                <option value="Early numeracy">Early Numeracy</option>
                <option value="Movement">Movement & Coordination</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#838fa6] uppercase mb-2">Wellness Status (Rating)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setTeacherRating(n)} className={`h-11 w-11 rounded-xl flex items-center justify-center transition ${teacherRating >= n ? 'bg-amber-100 text-amber-600' : 'bg-amber-50 text-amber-300 hover:bg-amber-100'}`}>
                    <Star size={20} fill={n <= teacherRating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#838fa6] uppercase mb-2">Learning Story & Daily Progress Details</label>
            <textarea value={teacherFbText} onChange={e => { setTeacherFbText(e.target.value); setTeacherFbSent(false); }} className="form-input min-h-36" placeholder="Describe what they did today, milestones reached, or story sessions completed..." />
          </div>

          {teacherFbSent && <p className="text-sm text-emerald-700 font-bold">✓ Daily learning story successfully published to parent portal!</p>}
          
          <button 
            onClick={async () => {
              if (!teacherFbText.trim() || !selectedStudent) return;
              setSubmittingFb(true);
              try {
                const student = dbStudents.find(s => s.name === selectedStudent);
                const payload = {
                  parentName: student?.parentName || 'Parent',
                  childName: student?.name || selectedStudent,
                  email: student?.email || 'parent@example.com',
                  contactNumber: '+91 99999 88888',
                  message: teacherFbText,
                  rating: teacherRating,
                  category: teacherCategory,
                  type: 'learning_story',
                  portalLogins: 1,
                  surveyCompleted: true,
                  eventAttended: false
                };
                await axios.post(`${backendUrl}/api/feedback/create`, payload, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                setTeacherFbSent(true);
                setTeacherFbText('');
              } catch (err) {
                console.error('Error submitting teacher feedback:', err);
                alert('Failed to submit child update.');
              } finally {
                setSubmittingFb(false);
              }
            }} 
            disabled={submittingFb} 
            className="btn-primary mt-4 w-full justify-center"
          >
            {submittingFb ? 'Publishing...' : 'Publish Update to Parent Portal'}
          </button>
        </div>

        <div className="portal-card p-6 h-fit space-y-4">
          <div className="h-12 w-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <h3 className="font-extrabold">Learning Story Pipeline</h3>
          <p className="text-xs text-[#7d879b] leading-relaxed">
            Publishing an update creates a live **learning_story** database record. 
            When the parent logs into their portal, this update instantly populates their active **"Today's learning story"** box, dynamic progress metrics, and notifications feed!
          </p>
        </div>
      </div>
    </PortalShell>
  );

  return (
    <PortalShell>
      <Header eyebrow="Teacher portal" title="Good morning, Priya!" subtitle="Here’s what’s happening with Nursery B today." user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} />
      
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric icon={Users} label="Students" value={activeStudentsCount} hint="All profiles"/>
        <Metric icon={UserCheck} label="Present today" value={presentCount} hint={`${attendanceRate}%`} tone="green"/>
        <Metric icon={MessageCircle} label="Parent messages" value={activeStudentsCount > 2 ? "3" : "1"} hint="New alerts" tone="purple"/>
        <Metric icon={CalendarDays} label="Today's activities" value="5" hint="On schedule" tone="orange"/>
      </div>
      
      <div className="grid xl:grid-cols-[1.55fr_1fr] gap-6 mt-6">
        <div className="portal-card p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-extrabold">Learner pulse</h3>
              <p className="text-xs text-[#8790a3] mt-1">Recent progress across your class</p>
            </div>
            <button onClick={()=>setCurrentPage('students')} className="text-xs font-bold text-[#155eef] flex items-center gap-1">
              View all <ArrowUpRight size={14}/>
            </button>
          </div>
          <StudentTable students={dbStudents.slice(0,4)} onSelectStudent={setSelectedStudentDetail}/>
        </div>
        
        <div className="portal-card p-6">
          <h3 className="font-extrabold">Today’s rhythm</h3>
          <p className="text-xs text-[#8790a3] mt-1 mb-5">Saturday, 28 June</p>
          {[['09:00','Circle time','Completed'],['10:00','Phonics & stories','Now'],['11:15','Creative movement','Next'],['12:15','Lunch & quiet time','']].map((a,i)=>(
            <div key={a[1]} className="flex gap-4 pb-5 last:pb-0">
              <div className={`h-3 w-3 mt-1 rounded-full ${i<1?'bg-emerald-500':i===1?'bg-[#155eef] ring-4 ring-blue-100':'bg-[#d8deea]'}`}/>
              <div className="flex-1">
                <p className="text-sm font-bold">{a[1]}</p>
                <p className="text-[10px] text-[#8a93a5] mt-1">{a[0]}</p>
              </div>
              {a[2]&&<span className="text-[10px] font-bold text-[#155eef]">{a[2]}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Drawer Overlay for Student Detail */}
      {selectedStudentDetail && (
        <div 
          className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px] z-50 flex justify-end transition-opacity" 
          onClick={() => setSelectedStudentDetail(null)}
        >
          <div 
            className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <Avatar student={selectedStudentDetail} />
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">{selectedStudentDetail.name}</h3>
                    <p className="text-xs text-[#8790a3]">Nursery B Student</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudentDetail(null)}
                  className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-[#909ab0] font-bold uppercase">Attendance Rate</p>
                    <p className="text-xl font-extrabold mt-1 text-[#155eef]">{selectedStudentDetail.attendance}%</p>
                  </div>
                  <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-[#909ab0] font-bold uppercase">Joy Status</p>
                    <p className="text-sm font-extrabold mt-1 text-slate-800">{selectedStudentDetail.status}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Family Info</h4>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2">
                    <p className="text-xs font-bold text-slate-700">Parent: <span className="font-normal text-slate-600">{selectedStudentDetail.parentName}</span></p>
                    <p className="text-xs font-bold text-slate-700">Email: <span className="font-normal text-slate-600">{selectedStudentDetail.email}</span></p>
                    <p className="text-xs font-bold text-slate-700">Age: <span className="font-normal text-slate-600">{selectedStudentDetail.age}</span></p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Latest Learning Story</h4>
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-xs text-amber-900 leading-relaxed italic">
                    "{selectedStudentDetail.latestFeedback || 'No learning story updates submitted for this student yet.'}"
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => {
                  const idx = dbStudents.findIndex(s => s.name === selectedStudentDetail.name);
                  if (idx !== -1) {
                    setActiveStudentIndex(idx);
                    setCurrentPage('communication');
                    setSelectedStudentDetail(null);
                  }
                }}
                className="btn-primary w-full justify-center"
              >
                Message Family
              </button>
              <button 
                onClick={() => {
                  setSelectedStudent(selectedStudentDetail.name);
                  setCurrentPage('feedback');
                  setSelectedStudentDetail(null);
                }}
                className="py-2.5 px-4 rounded-xl border border-[#dfe4ed] hover:bg-slate-50 transition text-xs font-extrabold"
              >
                Post Story
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}

function StudentTable({ students, onSelectStudent }) { return <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[10px] uppercase tracking-wider text-[#929aab]"><th className="pb-3">Student</th><th className="pb-3">Attendance</th><th className="pb-3">Progress</th><th className="pb-3">Status</th></tr></thead><tbody>{students.map(s=><tr key={s.name} onClick={() => onSelectStudent && onSelectStudent(s)} className="border-t border-[#edf0f5] cursor-pointer hover:bg-[#f8faff] transition"><td className="py-3"><div className="flex items-center gap-3"><Avatar student={s}/><div><p className="text-sm font-bold">{s.name}</p><p className="text-[10px] text-[#9199aa]">{s.age}</p></div></div></td><td className="text-xs font-bold">{s.attendance}%</td><td><div className="w-24 h-1.5 rounded-full bg-[#edf0f5]"><div className="h-full rounded-full bg-[#155eef]" style={{width:`${s.progress}%`}}/></div></td><td><StatusPill danger={s.status==='Needs support'}>{s.status}</StatusPill></td></tr>)}</tbody></table></div>; }
function Avatar({student}) { return <div className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-extrabold text-[#33405a]" style={{background:student.color}}>{student.initials}</div>; }
function PortalShell({children}) { return <div className="w-full max-w-[1380px] mx-auto p-6 md:p-8">{children}</div>; }

export function ParentPortal({ page, setCurrentPage, user, onLogout, backendUrl, token }) {
  const [rsvp, setRsvp] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [thanks, setThanks] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [feed, setFeed] = useState([]);
  const [activeMoment, setActiveMoment] = useState(null);
  const [error, setError] = useState(null);

  const fetchParentStudentData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [feedbackRes, meetingsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/feedback/list`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${backendUrl}/api/meeting/list`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setMeetings(Array.isArray(meetingsRes.data) ? meetingsRes.data : []);
      const dataList = Array.isArray(feedbackRes.data) ? feedbackRes.data : [];
      setFeed(dataList);

      if (dataList.length > 0) {
        const latestStoryDoc = dataList.find(f => f.type === 'learning_story');
        const first = latestStoryDoc || dataList[0];
        const baseProgress = Math.round(70 + (first.rating * 5));

        let rawKeywords = first.extractedKeywords || ['Communication', 'Development'];
        let parsedKeywords = ['Communication', 'Development'];
        try {
          if (Array.isArray(rawKeywords)) {
            parsedKeywords = rawKeywords;
          } else if (typeof rawKeywords === 'string') {
            parsedKeywords = JSON.parse(rawKeywords);
          }
        } catch (e) {
          console.warn("Failed parsing extractedKeywords, fallback to default", e);
        }

        setStudentData({
          parentName: first.parentName || user?.name || 'Parent',
          studentName: first.studentName || 'Your Child',
          classGrade: first.classGrade || 'Nursery B',
          attendance: '96%',
          joyScore: (first.rating * 2).toFixed(1),
          latestStory: first.rawText || 'Your child is doing beautifully in all class activities.',
          keywords: Array.isArray(parsedKeywords) ? parsedKeywords : ['Communication', 'Development'],
          progress: [
            { name: 'Communication & language', value: Math.min(100, baseProgress + 4) },
            { name: 'Social confidence', value: Math.min(100, baseProgress - 2) },
            { name: 'Creative expression', value: Math.min(100, baseProgress + 6) },
            { name: 'Early numeracy', value: Math.min(100, baseProgress - 6) },
            { name: 'Movement & coordination', value: Math.min(100, baseProgress + 2) }
          ]
        });
      } else {
        setStudentData({
          parentName: user.name,
          studentName: 'Aarav Sharma',
          classGrade: 'Nursery B',
          attendance: '96%',
          joyScore: '8.8',
          latestStory: 'Aarav was fully engaged during story explorers today. He named every character, waited patiently for his turn and helped a friend remember the ending.',
          keywords: ['Communication', 'Kindness'],
          progress: [
            { name: 'Communication & language', value: 92 },
            { name: 'Social confidence', value: 86 },
            { name: 'Creative expression', value: 94 },
            { name: 'Early numeracy', value: 78 },
            { name: 'Movement & coordination', value: 88 }
          ]
        });
      }
    } catch (err) {
      console.error('Error fetching parent student data:', err);
      const details = err.response
        ? `Server Error (${err.response.status}): ${typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data)}`
        : err.message;
      setError(`Failed to connect to database: ${details}`);
    } finally {
      setLoading(false);
    }
  }, [user, backendUrl]);

  useEffect(() => {
    fetchParentStudentData();
  }, [fetchParentStudentData]);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    try {
      const payload = {
        parentName: studentData?.parentName || user.name,
        childName: studentData?.studentName || 'Aarav Sharma',
        email: user.email,
        contactNumber: user.phone || '+91 99999 88888',
        message: feedback,
        rating: rating,
        category: 'General Inquiry',
        portalLogins: 1,
        surveyCompleted: true,
        eventAttended: false
      };
      await axios.post(`${backendUrl}/api/feedback/create`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setThanks(true);
      setFeedback('');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback.');
    }
  };

  const handleRsvpClick = async () => {
    const nextRsvp = !rsvp;
    setRsvp(nextRsvp);
    try {
      const payload = {
        parentName: studentData?.parentName || user.name,
        childName: studentData?.studentName || 'Aarav Sharma',
        email: user.email,
        contactNumber: user.phone || '+91 99999 88888',
        message: `RSVP response for Family Fun Day: ${nextRsvp ? 'Attending' : 'Not Attending'}`,
        rating: 5,
        category: 'Event RSVP',
        type: 'rsvp',
        portalLogins: 1,
        surveyCompleted: false,
        eventAttended: nextRsvp
      };
      await axios.post(`${backendUrl}/api/feedback/create`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error submitting RSVP feedback:', err);
    }
  };

  if (loading) {
    return (
      <PortalShell>
        <Header eyebrow="Parent portal" title="Loading Workspace..." subtitle="Connecting to school database" user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} backendUrl={backendUrl} />
        <div className="portal-card p-12 text-center text-slate-500 font-medium">
          Loading learning journey, notifications, and classroom moments...
        </div>
      </PortalShell>
    );
  }

  if (error || !studentData) {
    return (
      <PortalShell>
        <Header eyebrow="Parent portal" title="Connection Error" subtitle="Could not sync data" user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} backendUrl={backendUrl} />
        <div className="portal-card p-8 text-center max-w-lg mx-auto space-y-4">
          <p className="text-sm text-red-650 font-bold">{error || 'No student data found for this parent.'}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={fetchParentStudentData} 
              className="px-4 py-2.5 bg-[#155eef] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => {
                const newUrl = prompt("Enter custom backend API URL:", backendUrl);
                if (newUrl !== null) {
                  localStorage.setItem('firstcry-backend-url', newUrl);
                  window.location.reload();
                }
              }}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Configure URL
            </button>
          </div>
        </div>
      </PortalShell>
    );
  }

  const messagesList = [
    ...(Array.isArray(meetings) ? meetings : []).map(m => ({
      sender: 'Center Office',
      text: `Your parent-teacher meeting is scheduled: "${m.title}". Status: ${m.status}. Notes: ${m.meetingNotes || 'No notes shared yet.'}`,
      time: new Date(m.dateTime).toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })
    })),
    ...(Array.isArray(feed) ? feed : []).filter(f => f && (f.type === 'email' || f.type === 'learning_story')).map(f => ({
      sender: f.type === 'learning_story' ? 'Priya Ma’am (Teacher)' : 'School Operations',
      text: f.rawText || '',
      time: new Date(f.timestamp).toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })
    }))
  ];

  if (messagesList.length === 0) {
    messagesList.push(
      { sender: 'Priya Ma’am', text: `${studentData.studentName} loved story time today and confidently named all characters.`, time: '10:42 AM' },
      { sender: 'Center office', text: `Your parent-teacher meeting is confirmed for next Monday at 4:00 PM.`, time: 'Yesterday' }
    );
  }

  if (page === 'feedback') {
    return (
      <PortalShell>
        <Header eyebrow="Parent portal" title="Share feedback" subtitle={`Your voice helps us make ${studentData.studentName}’s days even brighter.`} user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} />
        <div className="portal-card max-w-2xl p-7">
          <h3 className="font-extrabold">How has your experience been?</h3>
          <div className="flex gap-2 my-5">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)} className={`h-11 w-11 rounded-xl flex items-center justify-center transition ${rating >= n ? 'bg-amber-100 text-amber-600' : 'bg-amber-50 text-amber-300 hover:bg-amber-100'}`}>
                <Star size={20} fill="currentColor" />
              </button>
            ))}
          </div>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="form-input min-h-36" placeholder={`Tell us what is going well or where we can help with ${studentData.studentName}…`} />
          {thanks && <p className="text-sm text-emerald-700 mt-3 font-bold">✓ Thank you — your feedback has been shared with the Center Team.</p>}
          <button onClick={handleSubmitFeedback} className="btn-primary mt-5">Submit feedback</button>
        </div>
      </PortalShell>
    );
  }

  if (page === 'messages') {
    return (
      <PortalShell>
        <Header eyebrow="Parent portal" title="Messages" subtitle={`A clear, caring connection with ${studentData.studentName}’s school.`} user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} />
        <div className="portal-card max-w-3xl p-6 space-y-3">
          {messagesList.map((m, i) => (
            <div key={i} className={`p-4 rounded-2xl border ${i === 0 ? 'bg-[#eef4ff] border-[#cddcff]' : 'bg-white border-[#e7eaf1]'}`}>
              <div className="flex justify-between">
                <p className="text-sm font-extrabold">{m.sender}</p>
                <span className="text-[10px] text-[#9098a9]">{m.time}</span>
              </div>
              <p className="text-xs text-[#687289] mt-2 leading-relaxed whitespace-pre-line">{m.text}</p>
            </div>
          ))}
        </div>
      </PortalShell>
    );
  }

  if (page === 'activities') {
    return (
      <PortalShell>
        <Header eyebrow="Parent portal" title="Classroom moments" subtitle="Little glimpses from a big week of discovery." user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} />
        
        <div className="grid md:grid-cols-3 gap-5">
          {[
            ['🎨', 'Colour Carnival', 'Creative expression'],
            ['🌱', 'Our tiny garden', 'Nature & responsibility'],
            ['📚', 'Story explorers', 'Language & imagination']
          ].map((a, i) => (
            <button 
              key={a[1]} 
              onClick={() => setActiveMoment(a)}
              className="portal-card overflow-hidden text-left hover:-translate-y-1 transition duration-200"
            >
              <div className={`h-44 flex items-center justify-center text-7xl ${['bg-[#ffe3d6]', 'bg-[#dff4e8]', 'bg-[#e4ebff]'][i]}`}>{a[0]}</div>
              <div className="p-5">
                <p className="font-extrabold">{a[1]}</p>
                <p className="text-xs text-[#7f889b] mt-1">{a[2]}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Moments Lightbox Modal */}
        {activeMoment && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px] z-50 flex items-center justify-center p-4 transition-opacity"
            onClick={() => setActiveMoment(null)}
          >
            <div 
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setActiveMoment(null)}
                className="absolute right-4 top-4 h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition z-10"
              >
                ✕
              </button>

              <div className="text-center mb-6">
                <span className="text-6xl">{activeMoment[0]}</span>
                <h3 className="text-xl font-extrabold mt-4 text-slate-800">{activeMoment[1]}</h3>
                <p className="text-xs text-[#155eef] font-bold uppercase mt-1 tracking-wider">{activeMoment[2]}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-5 min-h-[120px] flex flex-col justify-between">
                <p className="text-xs text-slate-600 leading-relaxed italic mb-4">
                  {activeMoment[1] === 'Colour Carnival' 
                    ? `During the Colour Carnival activity, the children had a wonderful sensory experience mixing finger paints. ${studentData?.studentName || 'Your child'} was particularly fascinated with yellow and blue, explaining how they make grass green. They painted a vibrant canvas filled with bright landscapes and trees.`
                    : activeMoment[1] === 'Our tiny garden'
                    ? `Today the class learned about planting seeds. ${studentData?.studentName || 'Your child'} potted a sunflower seed, labeled their pot, and placed it under the sun lamp. They are keeping a close watch for their first green sprout!`
                    : `In reading circle under the school shade tree, the kids explored interactive picture books. ${studentData?.studentName || 'Your child'} read confidently, describing all the characters and telling Priya Ma'am their favorite parts.`
                  }
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-16 bg-[#eef4ff] text-[#155eef] rounded-xl flex flex-col items-center justify-center font-bold text-[9px] border border-blue-100">
                      <span>📸 Moment</span>
                      <span className="text-[8px] opacity-75">Photo #{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </PortalShell>
    );
  }

  if (page === 'progress') {
    return (
      <PortalShell>
        <Header eyebrow="Parent portal" title={`${studentData?.studentName || 'Your Child'}’s learning journey`} subtitle="A gentle view of strengths, milestones and what comes next." user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} />
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="portal-card p-7">
            <h3 className="font-extrabold mb-6">Development areas</h3>
            {(Array.isArray(studentData?.progress) ? studentData.progress : []).map(p => (
              <div key={p.name} className="mb-5">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>{p.name}</span>
                  <span className="text-[#155eef]">{p.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#edf0f5]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#155eef] to-[#6f59e8]" style={{ width: `${p.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="portal-card p-6 h-fit">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Award size={27} />
            </div>
            <h3 className="font-extrabold mt-5">Star of the week</h3>
            <p className="text-xs text-[#798397] mt-2 leading-relaxed">For confidently retelling stories and showing language development in group sessions.</p>
            <div className="mt-5 p-4 bg-[#f7f8fc] rounded-2xl text-xs italic text-[#5f6980]">
              “{studentData.studentName} is becoming a wonderfully expressive storyteller.” — Priya Ma’am
            </div>
          </div>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <Header eyebrow="Parent portal" title={`Hello, ${(user?.name || 'Parent').split(' ')[0]}! 👋`} subtitle={`${studentData?.studentName || 'Your child'} had a bright, curious day at FirstCry.`} user={user} onLogout={onLogout} setCurrentPage={setCurrentPage} backendUrl={backendUrl} />
      <section className="rounded-[28px] bg-gradient-to-r from-[#155eef] to-[#6651df] text-white p-7 md:p-9 relative overflow-hidden">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="relative flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="text-blue-100 text-xs font-bold">TODAY AT A GLANCE</p>
            <h3 className="text-3xl font-extrabold !text-white mt-2">{studentData?.studentName || 'Your Child'} is doing wonderfully.</h3>
            <p className="text-blue-100 mt-2 text-sm">Present · 4 activities completed · 1 new classroom moment</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/12 rounded-2xl p-4 min-w-28">
              <p className="text-2xl font-extrabold !text-white">{studentData.attendance}</p>
              <p className="text-[10px] text-blue-100">Attendance</p>
            </div>
            <div className="bg-white/12 rounded-2xl p-4 min-w-28">
              <p className="text-2xl font-extrabold !text-white">{studentData.joyScore}</p>
              <p className="text-[10px] text-blue-100">Joy score</p>
            </div>
          </div>
        </div>
      </section>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mt-6">
        <div className="portal-card p-6">
          <div className="flex justify-between">
            <div>
              <h3 className="font-extrabold">Today’s learning story</h3>
              <p className="text-xs text-[#8490a4] mt-1">Shared by Priya Ma’am · 12:15 PM</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#fff0e8] text-[#e66d38] flex items-center justify-center">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="mt-5 p-5 rounded-2xl bg-[#faf7ff] border border-[#eee8ff]">
            <p className="text-sm leading-relaxed text-[#58627a]">{studentData.latestStory}</p>
            <div className="flex gap-2 mt-4">
              {(Array.isArray(studentData?.keywords) ? studentData.keywords : []).map(kw => (
                <StatusPill key={kw}>{kw}</StatusPill>
              ))}
            </div>
          </div>
          <button onClick={() => setCurrentPage('progress')} className="text-xs font-extrabold text-[#155eef] mt-5 flex items-center gap-1">
            View full progress <ChevronRight size={14} />
          </button>
        </div>
        <div className="portal-card p-6">
          <div className="flex justify-between">
            <div>
              <h3 className="font-extrabold">Family Fun Day</h3>
              <p className="text-xs text-[#8490a4] mt-1">Saturday, 5 July · 10:00 AM</p>
            </div>
            <CalendarDays className="text-[#7255d8]" />
          </div>
          <p className="text-xs text-[#6e7890] mt-5 leading-relaxed">Music, movement and tiny chefs! Join us for a joyful morning together.</p>
          <button onClick={handleRsvpClick} className={`w-full mt-6 py-3 rounded-xl text-sm font-extrabold transition ${rsvp ? 'bg-emerald-50 text-emerald-700' : 'bg-[#155eef] text-white'}`}>
            {rsvp ? '✓ You’re attending' : 'RSVP now'}
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <Quick icon={Camera} title="12 new photos" note="From this week" onClick={() => setCurrentPage('activities')} />
        <Quick icon={MessageCircle} title="Message teacher" note="Usually replies today" onClick={() => setCurrentPage('messages')} />
        <Quick icon={Heart} title="Share feedback" note="We’re listening" onClick={() => setCurrentPage('feedback')} />
      </div>
    </PortalShell>
  );
}
function Quick({icon:Icon,title,note,onClick}) { return <button onClick={onClick} className="portal-card p-5 text-left flex items-center gap-4 hover:-translate-y-0.5 transition"><div className="h-11 w-11 rounded-xl bg-[#eef4ff] text-[#155eef] flex items-center justify-center"><Icon size={20}/></div><div><p className="text-sm font-extrabold">{title}</p><p className="text-[10px] text-[#8b94a6] mt-1">{note}</p></div><ChevronRight size={16} className="ml-auto text-[#9da5b5]"/></button>; }
