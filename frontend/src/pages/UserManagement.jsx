import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Search, SlidersHorizontal, UserPlus, Users, GraduationCap, UserCheck, UserX, Sparkles, Eye, Pencil, KeyRound, Ban, Trash2, ChevronLeft, ChevronRight, X, Mail, Phone, School, Clock3, ShieldCheck, CheckCircle2, Loader2, AlertCircle, Check, RefreshCw } from 'lucide-react';

const emptyForm = { name: '', email: '', phone: '', role: 'teacher', assignedClass: '', password: '', status: 'active', assignedStudentIds: '' };

function Metric({ icon: Icon, label, value, tone }) {
  const colors = { blue: 'bg-blue-50 text-blue-600', violet: 'bg-violet-50 text-violet-600', green: 'bg-emerald-50 text-emerald-600', red: 'bg-red-50 text-red-600', orange: 'bg-orange-50 text-orange-600' };
  return <div className="portal-card p-5"><div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colors[tone]}`}><Icon size={19}/></div><p className="text-xs font-semibold text-[#7b8499] mt-4">{label}</p><p className="text-2xl font-extrabold mt-1">{value ?? '-'}</p></div>;
}

function Avatar({ user, large = false }) {
  const colors = user.role === 'teacher' ? 'bg-[#ede9ff] text-[#6949d7]' : 'bg-[#e8f3ff] text-[#1761c8]';
  return <div className={`${large ? 'h-16 w-16 text-xl rounded-2xl' : 'h-10 w-10 text-xs rounded-xl'} ${colors} shrink-0 flex items-center justify-center font-extrabold`}>{user.name?.split(' ').map(v => v[0]).slice(0, 2).join('')}</div>;
}

function Status({ status }) { return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold capitalize ${status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}/>{status}</span>; }

export default function UserManagement({ backendUrl }) {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [assignedClass, setAssignedClass] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { search, role, status, assignedClass, page, limit: 8 };
      const [{ data }, statsResponse] = await Promise.all([
        axios.get(`${backendUrl}/api/admin/users`, { params }),
        axios.get(`${backendUrl}/api/admin/users/stats`)
      ]);
      setUsers(data.users); setTotalPages(data.totalPages); setTotal(data.total); setStats(statsResponse.data); setSelected([]);
    } catch (err) { setError(err.response?.data?.error || 'User records could not be loaded.'); }
    finally { setLoading(false); }
  }, [backendUrl, search, role, status, assignedClass, page]);

  useEffect(() => { const timer = setTimeout(fetchUsers, search ? 250 : 0); return () => clearTimeout(timer); }, [fetchUsers, search]);
  useEffect(() => { setPage(1); }, [role, status, assignedClass]);

  const openCreate = () => { setForm(emptyForm); setActiveUser(null); setModal('create'); setNotice(''); };
  const openUser = async (user, mode = 'view') => {
    setNotice(''); setModal(mode); setActiveUser(user);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/users/${user.id}`);
      setActiveUser(data.user);
      setForm({ ...emptyForm, ...data.user, assignedStudentIds: (data.user.assignedStudentIds || []).join(', ') });
    } catch (err) { setNotice(err.response?.data?.error || 'Could not load account details.'); }
  };

  const submitForm = async (event) => {
    event.preventDefault(); setSaving(true); setNotice('');
    try {
      const payload = { ...form, assignedStudentIds: String(form.assignedStudentIds || '').split(',').map(v => v.trim()).filter(Boolean) };
      if (modal === 'create') await axios.post(`${backendUrl}/api/admin/users`, payload);
      else await axios.put(`${backendUrl}/api/admin/users/${activeUser.id}`, payload);
      setModal(null); await fetchUsers();
    } catch (err) { setNotice(err.response?.data?.error || 'Changes could not be saved.'); }
    finally { setSaving(false); }
  };

  const changeStatus = async user => {
    const next = user.status === 'active' ? 'disabled' : 'active';
    await axios.patch(`${backendUrl}/api/admin/users/${user.id}/status`, { status: next });
    setModal(null); await fetchUsers();
  };

  const resetPassword = async user => {
    setSaving(true); setNotice('');
    try { const { data } = await axios.post(`${backendUrl}/api/admin/users/${user.id}/reset-password`, {}); setNotice(`Temporary password: ${data.temporaryPassword}`); }
    catch (err) { setNotice(err.response?.data?.error || 'Password reset failed.'); }
    finally { setSaving(false); }
  };

  const deleteUser = async user => {
    if (!window.confirm(`Permanently delete ${user.name}'s account?`)) return;
    await axios.delete(`${backendUrl}/api/admin/users/${user.id}`); setModal(null); await fetchUsers();
  };

  const bulkAction = async action => {
    if (!selected.length) return;
    if (action === 'delete' && !window.confirm(`Delete ${selected.length} selected accounts?`)) return;
    await axios.post(`${backendUrl}/api/admin/users/bulk/action`, { ids: selected, action }); await fetchUsers();
  };

  const toggleAll = () => setSelected(selected.length === users.length ? [] : users.map(user => user.id));
  const pageStart = total ? (page - 1) * 8 + 1 : 0;
  const pageEnd = Math.min(page * 8, total);

  return <div className="w-full max-w-[1500px] mx-auto p-6 md:p-8">
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-7"><div><p className="text-xs font-extrabold tracking-[.14em] text-[#155eef] uppercase">Admin console</p><h2 className="text-3xl font-extrabold mt-1">User Management</h2><p className="text-sm text-[#7d8699] mt-1">Control identities, account access and role assignments.</p></div><button onClick={openCreate} className="btn-primary"><UserPlus size={17}/> Create account</button></header>

    <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6"><Metric icon={Users} label="Total Parents" value={stats.totalParents} tone="blue"/><Metric icon={GraduationCap} label="Total Teachers" value={stats.totalTeachers} tone="violet"/><Metric icon={UserCheck} label="Active Users" value={stats.activeUsers} tone="green"/><Metric icon={UserX} label="Disabled Users" value={stats.disabledUsers} tone="red"/><Metric icon={Sparkles} label="New Registrations" value={stats.newRegistrations} tone="orange"/></div>

    <div className="portal-card overflow-hidden">
      <div className="p-5 border-b border-[#e6eaf1] flex flex-col xl:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-xl"><Search size={17} className="absolute left-3.5 top-3.5 text-[#8c95a7]"/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search name, email, mobile or class-" className="form-input pl-10"/></div>
        <div className="flex flex-wrap gap-2"><button onClick={()=>setShowFilters(v=>!v)} className={`btn-secondary py-2.5 ${showFilters?'!border-[#155eef] !text-[#155eef]':''}`}><SlidersHorizontal size={16}/> Advanced filters</button><button onClick={fetchUsers} className="icon-button"><RefreshCw size={16}/></button></div>
      </div>

      {showFilters && <div className="px-5 py-4 bg-[#f8faff] border-b border-[#e6eaf1] grid sm:grid-cols-3 gap-3"><Filter label="Role" value={role} onChange={setRole} options={[['all','All roles'],['teacher','Teachers'],['parent','Parents']]}/><Filter label="Account status" value={status} onChange={setStatus} options={[['all','All statuses'],['active','Active'],['disabled','Disabled']]}/><Filter label="Assigned class" value={assignedClass} onChange={setAssignedClass} options={[['all','All classes'],['Nursery B','Nursery B'],['Playgroup A','Playgroup A'],['Toddler C','Toddler C'],['Kindergarten A','Kindergarten A']]}/></div>}

      {selected.length > 0 && <div className="px-5 py-3 bg-[#eef4ff] border-b border-[#cfddfb] flex flex-wrap items-center gap-2"><b className="text-xs text-[#155eef] mr-2">{selected.length} selected</b><button onClick={()=>bulkAction('activate')} className="bulk-btn"><Check size={13}/> Activate</button><button onClick={()=>bulkAction('disable')} className="bulk-btn"><Ban size={13}/> Disable</button><button onClick={()=>bulkAction('delete')} className="bulk-btn !text-red-600"><Trash2 size={13}/> Delete</button></div>}

      {error ? <div className="p-12 text-center"><AlertCircle className="mx-auto text-red-500"/><p className="text-sm font-bold mt-3">{error}</p><button onClick={fetchUsers} className="text-xs font-bold text-[#155eef] mt-3">Try again</button></div> :
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px]"><thead><tr className="bg-[#fafbfe] text-left text-[10px] uppercase tracking-wider text-[#8992a5]"><th className="px-5 py-3"><input type="checkbox" checked={users.length > 0 && selected.length === users.length} onChange={toggleAll}/></th><th>User</th><th>Mobile</th><th>Role</th><th>Assigned class</th><th>Status</th><th>Last login</th><th className="pr-5 text-right">Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="8" className="py-16 text-center"><Loader2 className="animate-spin mx-auto text-[#155eef]"/></td></tr> : users.map(user => <tr key={user.id} className="border-t border-[#edf0f5] hover:bg-[#fbfcff]"><td className="px-5 py-3"><input type="checkbox" checked={selected.includes(user.id)} onChange={()=>setSelected(list=>list.includes(user.id)?list.filter(id=>id!==user.id):[...list,user.id])}/></td><td className="py-3"><div className="flex items-center gap-3"><Avatar user={user}/><div><p className="text-sm font-extrabold">{user.name}</p><p className="text-[10px] text-[#818a9e] mt-0.5">{user.email}</p></div></div></td><td className="text-xs text-[#59647a]">{user.phone || '-'}</td><td><span className={`role-pill ${user.role}`}>{user.role}</span></td><td className="text-xs font-semibold">{user.assignedClass || 'Unassigned'}</td><td><Status status={user.status}/></td><td><p className="text-xs font-semibold">{formatDate(user.lastLogin)}</p><p className="text-[9px] text-[#969eae]">{user.lastLogin ? formatTime(user.lastLogin) : 'Never'}</p></td><td className="pr-5"><div className="flex justify-end gap-1"><Action title="View" icon={Eye} onClick={()=>openUser(user)}/><Action title="Edit" icon={Pencil} onClick={()=>openUser(user,'edit')}/><Action title="Reset password" icon={KeyRound} onClick={()=>openUser(user,'reset')}/><Action title={user.status==='active'?'Disable':'Activate'} icon={user.status==='active'?Ban:CheckCircle2} onClick={()=>changeStatus(user)}/><Action title="Delete" icon={Trash2} danger onClick={()=>deleteUser(user)}/></div></td></tr>)}</tbody></table></div>}

      <div className="p-4 border-t border-[#e7eaf1] flex justify-between items-center"><p className="text-xs text-[#7e879a]">Showing <b>{pageStart}-{pageEnd}</b> of <b>{total}</b> users</p><div className="flex items-center gap-2"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="page-btn"><ChevronLeft size={15}/></button><span className="text-xs font-bold px-2">Page {page} of {totalPages}</span><button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="page-btn"><ChevronRight size={15}/></button></div></div>
    </div>

    {modal && <Modal title={modal==='create'?'Create new account':modal==='edit'?'Edit account':modal==='reset'?'Reset password':'Account details'} onClose={()=>setModal(null)}>
      {modal === 'view' && activeUser ? <UserDetails user={activeUser} onEdit={()=>setModal('edit')} onReset={()=>setModal('reset')} onStatus={()=>changeStatus(activeUser)} onDelete={()=>deleteUser(activeUser)}/> : modal === 'reset' && activeUser ? <div><div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f7f8fc]"><Avatar user={activeUser}/><div><p className="font-extrabold">{activeUser.name}</p><p className="text-xs text-[#7e879a]">{activeUser.email}</p></div></div><p className="text-sm text-[#687288] leading-relaxed mt-5">Generate a strong temporary password. Share it securely; the password is shown only once.</p>{notice&&<div className="mt-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold break-all">{notice}</div>}<button disabled={saving} onClick={()=>resetPassword(activeUser)} className="btn-primary w-full mt-5">{saving?<Loader2 size={16} className="animate-spin"/>:<KeyRound size={16}/>} Generate temporary password</button></div> : <AccountForm form={form} setForm={setForm} onSubmit={submitForm} saving={saving} notice={notice} editing={modal==='edit'}/>} 
    </Modal>}
  </div>;
}

function Filter({ label, value, onChange, options }) { return <label className="text-[10px] font-bold uppercase tracking-wider text-[#727d92]">{label}<select value={value} onChange={e=>onChange(e.target.value)} className="form-input mt-1.5 normal-case text-sm tracking-normal">{options.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>; }
function Action({ title, icon: Icon, onClick, danger }) { return <button title={title} onClick={onClick} className={`h-8 w-8 rounded-lg border border-transparent flex items-center justify-center transition ${danger?'text-red-500 hover:bg-red-50':'text-[#758095] hover:bg-[#eef4ff] hover:text-[#155eef]'}`}><Icon size={15}/></button>; }
function Modal({ title, children, onClose }) { return <div className="fixed inset-0 z-50 bg-[#101728]/45 backdrop-blur-sm flex justify-end" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><aside className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto"><div className="p-6 border-b border-[#e6eaf1] flex justify-between items-center sticky top-0 bg-white z-10"><div><p className="text-[10px] text-[#155eef] font-extrabold tracking-wider uppercase">Admin action</p><h3 className="text-xl font-extrabold mt-1">{title}</h3></div><button onClick={onClose} className="icon-button"><X size={18}/></button></div><div className="p-6">{children}</div></aside></div>; }

function AccountForm({ form, setForm, onSubmit, saving, notice, editing }) {
  const field = (key, value) => setForm(current => ({ ...current, [key]: value }));
  return <form onSubmit={onSubmit} className="space-y-5">{notice&&<div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{notice}</div>}<div className="grid sm:grid-cols-2 gap-4"><Input label="Full name" value={form.name} onChange={v=>field('name',v)} required/><Input label="Mobile number" value={form.phone} onChange={v=>field('phone',v)}/></div><Input label="Email address" type="email" value={form.email} onChange={v=>field('email',v)} required/><div className="grid sm:grid-cols-2 gap-4"><Select label="Role" value={form.role} onChange={v=>field('role',v)} disabled={editing} options={[['teacher','Teacher'],['parent','Parent']]}/><Select label="Account status" value={form.status} onChange={v=>field('status',v)} disabled={editing} options={[['active','Active'],['disabled','Disabled']]}/></div><Input label="Assigned class" value={form.assignedClass} onChange={v=>field('assignedClass',v)} placeholder="e.g. Nursery B"/><Input label="Assigned student IDs" value={form.assignedStudentIds} onChange={v=>field('assignedStudentIds',v)} placeholder="FC-2026-001, FC-2026-002"/><Input label={editing?'Password managed through reset action':'Temporary password'} type="password" value={form.password} onChange={v=>field('password',v)} disabled={editing} required={!editing} placeholder={editing?'Use Reset Password':'8+ chars: upper, lower, number, symbol'}/><button disabled={saving} className="btn-primary w-full">{saving?<Loader2 size={16} className="animate-spin"/>:<ShieldCheck size={16}/>} {editing?'Save changes':'Create secure account'}</button></form>;
}
function Input({ label, value, onChange, type='text', ...props }) { return <label className="form-label !mb-0">{label}<input type={type} value={value || ''} onChange={e=>onChange(e.target.value)} className="form-input mt-2 normal-case tracking-normal" {...props}/></label>; }
function Select({ label, value, onChange, options, ...props }) { return <label className="form-label !mb-0">{label}<select value={value} onChange={e=>onChange(e.target.value)} className="form-input mt-2 normal-case tracking-normal" {...props}>{options.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>; }

function UserDetails({ user, onEdit, onReset, onStatus, onDelete }) {
  return <div><div className="flex items-center gap-4"><Avatar user={user} large/><div><h4 className="text-lg font-extrabold">{user.name}</h4><div className="flex gap-2 mt-2"><span className={`role-pill ${user.role}`}>{user.role}</span><Status status={user.status}/></div></div></div><div className="grid sm:grid-cols-2 gap-3 mt-6"><Detail icon={Mail} label="Email" value={user.email}/><Detail icon={Phone} label="Mobile" value={user.phone||'Not provided'}/><Detail icon={School} label="Assigned class" value={user.assignedClass||'Unassigned'}/><Detail icon={Clock3} label="Last login" value={user.lastLogin?`${formatDate(user.lastLogin)}, ${formatTime(user.lastLogin)}`:'Never'}/></div><section className="mt-7"><h5 className="text-sm font-extrabold">Assigned students</h5><div className="flex flex-wrap gap-2 mt-3">{user.assignedStudentIds?.length?user.assignedStudentIds.map(id=><span key={id} className="px-3 py-1.5 rounded-lg bg-[#eef4ff] text-[#155eef] text-xs font-bold">{id}</span>):<p className="text-xs text-[#8a93a5]">No students assigned.</p>}</div></section><section className="mt-7"><h5 className="text-sm font-extrabold">Login history</h5><div className="mt-3 border border-[#e7eaf1] rounded-2xl overflow-hidden">{[...(user.loginHistory||[])].slice(0,5).map((log,i)=><div key={`${log.timestamp}-${i}`} className="p-3 border-b last:border-0 border-[#edf0f5]"><p className="text-xs font-bold">{log.result || 'Login'} from {log.ipAddress || 'Unknown IP'}</p><p className="text-[9px] text-[#9098a9] mt-1">{formatDate(log.timestamp)} - {formatTime(log.timestamp)} - {log.userAgent || 'Unknown device'}</p></div>)}{!user.loginHistory?.length&&<p className="p-5 text-xs text-[#8a93a5]">No login history recorded yet.</p>}</div></section><section className="mt-7"><h5 className="text-sm font-extrabold">Activity logs</h5><div className="mt-3 border border-[#e7eaf1] rounded-2xl overflow-hidden">{[...(user.activityLogs||[])].slice(0,5).map((log,i)=><div key={`${log.timestamp}-${i}`} className="p-3 border-b last:border-0 border-[#edf0f5] flex gap-3"><div className="h-8 w-8 rounded-lg bg-[#eef4ff] text-[#155eef] flex items-center justify-center"><CheckCircle2 size={14}/></div><div><p className="text-xs font-bold">{log.action}</p><p className="text-[9px] text-[#9098a9] mt-1">{formatDate(log.timestamp)} - {formatTime(log.timestamp)} - {log.actor}</p></div></div>)}{!user.activityLogs?.length&&<p className="p-5 text-xs text-[#8a93a5]">No account activity recorded yet.</p>}</div></section><div className="grid grid-cols-2 gap-2 mt-7"><button onClick={onEdit} className="btn-secondary"><Pencil size={15}/> Edit</button><button onClick={onReset} className="btn-secondary"><KeyRound size={15}/> Reset password</button><button onClick={onStatus} className="btn-secondary"><Ban size={15}/> {user.status==='active'?'Suspend':'Activate'}</button><button onClick={onDelete} className="px-5 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2"><Trash2 size={15}/> Delete</button></div></div>;
}
function Detail({ icon:Icon, label, value }) { return <div className="p-4 rounded-2xl bg-[#f8f9fc]"><Icon size={15} className="text-[#155eef]"/><p className="text-[9px] uppercase font-bold text-[#929aab] mt-3">{label}</p><p className="text-xs font-bold mt-1 break-all">{value}</p></div>; }
function formatDate(value) { return value ? new Date(value).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : 'Never'; }
function formatTime(value) { return value ? new Date(value).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : ''; }
