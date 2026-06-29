import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GraduationCap, Lock, Mail, Loader2, AlertCircle, ShieldCheck, Users, Heart, ArrowRight, CheckCircle2 } from 'lucide-react';

const accounts = {
  admin: { label: 'Admin portal', email: 'admin@firstcry.com', password: 'admin', icon: ShieldCheck, note: 'Center analytics & operations' },
  teacher: { label: 'Teacher portal', email: 'priya@firstcry.com', password: 'teacher', icon: Users, note: 'Classroom & student records' },
  parent: { label: 'Parent portal', email: 'rahul.sharma@example.com', password: 'parent', icon: Heart, note: 'Child progress & engagement' }
};
export default function Login({ onLoginSuccess, backendUrl, setBackendUrl }) {
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState(accounts.admin.email);
  const [password, setPassword] = useState(accounts.admin.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [databaseStatus, setDatabaseStatus] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(backendUrl);

  useEffect(() => {
    setBackendStatus('checking');
    axios.get(`${backendUrl}/api/status`)
      .then(res => {
        setBackendStatus('online');
        setDatabaseStatus(res.data.database || 'Connected');
      })
      .catch(err => {
        setBackendStatus('offline');
        console.error('Backend status check failed:', err);
      });
  }, [backendUrl]);

  useEffect(() => {
    setTempUrl(backendUrl);
  }, [backendUrl]);

  const chooseRole = (nextRole) => {
    setRole(nextRole);
    setEmail(accounts[nextRole].email);
    setPassword(accounts[nextRole].password);
    setError('');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setBackendUrl(tempUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${backendUrl}/api/auth/login`, { email, password });
      onLoginSuccess(response.data.user, response.data.token);
    } catch (err) {
      if (!err.response) {
        setError(`Backend connection error: ${err.message}. Please verify that the backend server is running and accessible.`);
      } else {
        setError(err.response?.data?.error || 'Unable to sign in. Please check the selected demo account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.08fr_.92fr] bg-[#f7f8fc]">
      <section className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#0b4dd8] via-[#285ee9] to-[#6d52e8] text-white p-14 flex-col justify-between">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize:'28px 28px'}} />
        <div className="relative flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center"><GraduationCap /></div>
          <div><p className="font-bold text-lg">FirstCry Intellitots</p><p className="text-xs text-blue-100">One school. Three connected experiences.</p></div>
        </div>
        <div className="relative max-w-xl">
          <span className="inline-flex rounded-full bg-white/12 border border-white/20 px-4 py-2 text-xs font-bold tracking-wide mb-6">INTELLIGENT CHILDHOOD ECOSYSTEM</span>
          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight !text-white">Every child’s journey,<br/>beautifully connected.</h1>
          <p className="mt-5 text-lg leading-relaxed text-blue-50/90 max-w-lg">A shared digital home for center leaders, teachers and families—built around progress, trust and joyful learning.</p>
        </div>
        <div className="relative grid grid-cols-3 gap-3 text-sm">
          {['Smart insights','Clear communication','Happy families'].map(item => <div key={item} className="rounded-2xl bg-white/10 border border-white/15 p-4 font-semibold">{item}</div>)}
        </div>
      </section>

      <section className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex items-center gap-3 mb-8"><div className="h-10 w-10 rounded-xl bg-[#155eef] text-white flex items-center justify-center"><GraduationCap size={20}/></div><b>FirstCry Intellitots</b></div>
          <p className="text-sm font-bold text-[#155eef] mb-2">WELCOME BACK</p>
          <h2 className="text-3xl font-extrabold text-[#172033]">Choose your portal</h2>
          <p className="text-[#7b8499] mt-2 mb-7">Select a role to load its demo account and continue.</p>

          <div className="grid sm:grid-cols-3 gap-3 mb-7">
            {Object.entries(accounts).map(([key, account]) => {
              const Icon = account.icon;
              return <button type="button" key={key} onClick={() => chooseRole(key)} className={`text-left rounded-2xl border p-4 transition-all ${role === key ? 'border-[#155eef] bg-[#eef4ff] shadow-[0_8px_24px_rgba(21,94,239,.12)]' : 'border-[#e2e6ef] bg-white hover:border-[#b9c7e5]'}`}>
                <Icon size={20} className={role === key ? 'text-[#155eef]' : 'text-[#6f7890]'} />
                <p className="font-bold text-sm mt-3">{account.label}</p><p className="text-[10px] text-[#8a93a7] mt-1 leading-snug">{account.note}</p>
              </button>;
            })}
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-[#e4e8f0] rounded-3xl p-6 shadow-[0_18px_50px_rgba(34,52,84,.08)] space-y-5">
            {backendStatus === 'offline' && (
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600"/>
                <div className="flex-grow">
                  <p className="font-bold text-rose-800">Backend Server Offline</p>
                  <p className="text-rose-600/90 mt-0.5 leading-relaxed">
                    Cannot connect to backend at <code>{backendUrl || 'relative proxy (port 5001)'}</code>.
                  </p>
                  <button 
                    type="button" 
                    onClick={() => setShowSettings(!showSettings)} 
                    className="mt-2 text-[#155eef] font-bold hover:underline block"
                  >
                    {showSettings ? 'Hide Settings' : 'Configure Backend URL'}
                  </button>
                </div>
              </div>
            )}
            
            {showSettings && (
              <div className="p-3.5 bg-[#f8f9fc] border border-[#e2e6ef] rounded-2xl space-y-2.5">
                <p className="text-[10px] font-bold text-[#475467]">BACKEND API BASE URL</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={tempUrl} 
                    onChange={e => setTempUrl(e.target.value)} 
                    placeholder="e.g. http://localhost:5001 or https://..." 
                    className="form-input text-xs py-1.5 flex-grow"
                  />
                  <button 
                    type="button" 
                    onClick={handleSaveSettings} 
                    className="btn-primary text-xs px-3.5 py-1.5 shrink-0"
                  >
                    Save
                  </button>
                </div>
                <p className="text-[9px] text-[#6f7890] leading-snug">
                  Leave blank to use the default relative proxy. Change this if your frontend runs on a different domain or port.
                </p>
              </div>
            )}

            {error && <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs"><AlertCircle size={16}/>{error}</div>}
            <div><label className="form-label" htmlFor="email">Email address or username</label><div className="relative"><Mail className="absolute left-4 top-3.5 h-4 w-4 text-[#8b94a8]"/><input id="email" type="text" value={email} onChange={e=>setEmail(e.target.value)} className="form-input pl-11" required/></div></div>
            <div><div className="flex justify-between"><label className="form-label" htmlFor="password">Password</label><span className="text-[10px] text-[#155eef] font-bold">Demo credentials filled</span></div><div className="relative"><Lock className="absolute left-4 top-3.5 h-4 w-4 text-[#8b94a8]"/><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="form-input pl-11" required/></div></div>
            <button disabled={loading} className="w-full btn-primary py-3.5">{loading ? <><Loader2 size={17} className="animate-spin"/>Signing in...</> : <>Enter {accounts[role].label}<ArrowRight size={17}/></>}</button>
            
            <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[10px] font-medium text-[#7b8499]">
              {backendStatus === 'checking' && (
                <>
                  <Loader2 size={10} className="animate-spin text-blue-500" />
                  Checking backend connection...
                </>
              )}
              {backendStatus === 'online' && (
                <>
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  <span className="text-emerald-600">Backend Online</span>
                  <span className="text-gray-300">|</span>
                  <span>{databaseStatus}</span>
                </>
              )}
              {backendStatus === 'offline' && (
                <>
                  <AlertCircle size={11} className="text-rose-500" />
                  <span className="text-rose-600 font-bold">Backend Offline</span>
                </>
              )}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
