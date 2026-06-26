import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquarePlus, 
  CalendarRange, 
  Sparkles, 
  History, 
  FileText, 
  BarChart3, 
  LogOut,
  GraduationCap
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, onLogout, user }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'feedback-form', label: 'Feedback Ingestion', icon: MessageSquarePlus },
    { id: 'meeting-scheduler', label: 'Meeting Scheduler', icon: CalendarRange },
    { id: 'sentiment-analysis', label: 'Sentiment Sandbox', icon: Sparkles },
    { id: 'communication-history', label: 'Communication Timeline', icon: History },
    { id: 'notice-generator', label: 'Notice Generator', icon: FileText },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 }
  ];

  return (
    <aside className="w-72 bg-white border-r border-[#E6DDD0] min-h-screen flex flex-col justify-between py-6 shrink-0 sticky top-0 z-40">
      <div>
        {/* Brand Logo Header */}
        <div className="px-6 pb-6 border-b border-[#E6DDD0]/60 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#FF8562] to-[#FF6B4A] flex items-center justify-center shadow-lg shadow-[#FF8562]/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-[#4A433A]">
              Firstcry
            </h1>
            <p className="text-[10px] text-[#9E9588] font-bold tracking-wider uppercase">
              Sentiment Console
            </p>
          </div>
        </div>

        {/* User Info Details */}
        {user && (
          <div className="px-6 py-4 border-b border-[#E6DDD0]/40 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#FCFAF7] border border-[#E6DDD0] flex items-center justify-center font-bold text-sm text-[#FF8562]">
              {user.name ? user.name[0] : 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-[#4A433A] truncate">{user.name}</p>
              <p className="text-[10px] text-[#88B097] font-semibold capitalize">{user.role || 'Admin'}</p>
            </div>
          </div>
        )}

        {/* Navigation Items List */}
        <nav className="mt-6 px-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-[#FF8562]/10 text-[#FF8562] border-l-4 border-[#FF8562]' 
                    : 'text-[#7D7263] hover:text-[#4A433A] hover:bg-[#FAF7F2] border-l-4 border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer Section */}
      <div className="px-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-[#7D7263] hover:text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
