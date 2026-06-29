import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import HeaderTools from './components/HeaderTools';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeedbackForm from './pages/FeedbackForm';
import MeetingScheduler from './pages/MeetingScheduler';
import SentimentAnalysis from './pages/SentimentAnalysis';
import CommunicationHistory from './pages/CommunicationHistory';
import NoticeGenerator from './pages/NoticeGenerator';
import Reports from './pages/Reports';
import FeedbackDetail from './pages/FeedbackDetail';
import { TeacherPortal, ParentPortal } from './pages/RolePortals';
import UserManagement from './pages/UserManagement';

const savedSession = (() => {
  try { return JSON.parse(localStorage.getItem('firstcry-session')) || {}; }
  catch { return {}; }
})();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white border border-red-200 rounded-3xl p-8 max-w-xl w-full shadow-lg space-y-4">
            <h2 className="text-xl font-extrabold text-red-700">Application Error</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Something went wrong while rendering this page. Below is the error detail:
            </p>
            <pre className="p-4 bg-red-50 text-red-800 rounded-2xl text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">
              {this.state.error?.toString()}
              {"\n"}
              {this.state.error?.stack}
            </pre>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2.5 bg-[#155eef] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
              >
                Reload Page
              </button>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }} 
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Reset Site Data
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedParentId, setSelectedParentId] = useState('');

  const [backendUrl, setBackendUrl] = useState(() => {
    const stored = localStorage.getItem('firstcry-backend-url');
    if (stored && stored !== 'undefined' && stored !== 'null' && stored.trim() !== '') {
      return stored;
    }
    return import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://firstcry-parent-setiment-dashboard.onrender.com');
  });

  const handleLoginSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    axios.defaults.headers.common.Authorization = `Bearer ${userToken}`;
    localStorage.setItem('firstcry-session', JSON.stringify({ token: userToken, user: userData }));
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = useCallback((shouldCallApi = true) => {
    if (shouldCallApi && token) {
      axios.post(`${backendUrl}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
    setUser(null);
    setToken('');
    setIsAuthenticated(false);
    localStorage.removeItem('firstcry-session');
    axios.defaults.headers.common.Authorization = '';
  }, [backendUrl, token]);

  const handleSwitchRole = async (role) => {
    let email = 'admin@firstcry.com';
    let password = 'admin';
    if (role === 'teacher') {
      email = 'priya@firstcry.com';
      password = 'teacher';
    } else if (role === 'parent') {
      email = 'parent';
      password = 'parent';
    }
    
    try {
      const response = await axios.post(`${backendUrl}/api/auth/login`, { email, password });
      handleLoginSuccess(response.data.user, response.data.token);
    } catch (err) {
      console.error('Failed to switch role:', err);
      alert('Failed to automatically switch portal role. Please try manually.');
    }
  };

  useEffect(() => {
    if (!token) return;
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    axios.get(`${backendUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ data }) => {
      setUser(data.user);
      localStorage.setItem('firstcry-session', JSON.stringify({ token, user: data.user }));
    }).catch(() => handleLogout(false));
  }, [token, backendUrl, handleLogout]);

  const renderPage = () => {
    if (user?.role === 'teacher') {
      return (
        <TeacherPortal 
          page={currentPage} 
          setCurrentPage={setCurrentPage} 
          user={user} 
          onLogout={handleLogout} 
          backendUrl={backendUrl}
          token={token}
        />
      );
    }

    if (user?.role === 'parent') {
      return (
        <ParentPortal 
          page={currentPage} 
          setCurrentPage={setCurrentPage} 
          user={user} 
          onLogout={handleLogout} 
          backendUrl={backendUrl}
          token={token}
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            setCurrentPage={setCurrentPage} 
            setSelectedParentId={setSelectedParentId} 
            backendUrl={backendUrl} 
          />
        );
      case 'user-management':
        return <UserManagement backendUrl={backendUrl} />;
      case 'feedback-form':
        return <FeedbackForm backendUrl={backendUrl} />;
      case 'meeting-scheduler':
        return (
          <MeetingScheduler 
            backendUrl={backendUrl} 
            preselectedParentId={selectedParentId} 
          />
        );
      case 'sentiment-analysis':
        return <SentimentAnalysis backendUrl={backendUrl} />;
      case 'communication-history':
        return <CommunicationHistory backendUrl={backendUrl} />;
      case 'notice-generator':
        return (
          <NoticeGenerator 
            backendUrl={backendUrl} 
            preselectedParentId={selectedParentId} 
          />
        );
      case 'reports':
        return <Reports backendUrl={backendUrl} />;
      case 'feedback-detail':
        return (
          <FeedbackDetail 
            parentId={selectedParentId}
            onBack={() => setCurrentPage('dashboard')}
            backendUrl={backendUrl}
          />
        );
      default:
        return (
          <Dashboard 
            setCurrentPage={setCurrentPage} 
            setSelectedParentId={setSelectedParentId} 
            backendUrl={backendUrl} 
          />
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          backendUrl={backendUrl} 
          setBackendUrl={(url) => {
            localStorage.setItem('firstcry-backend-url', url);
            setBackendUrl(url);
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-[#f6f7fb] text-[#172033] overflow-x-hidden">
        
        {/* Sidebar Navigation */}
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={(page) => {
            // Reset preselected parent ID when navigating away from action targets
            if (page !== 'meeting-scheduler' && page !== 'notice-generator') {
              setSelectedParentId('');
            }
            setCurrentPage(page);
          }} 
          onLogout={handleLogout}
          user={user}
          onSwitchRole={handleSwitchRole}
        />

        {/* Main Content Area Panel */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {user?.role === 'admin' && (
            <div className="w-full max-w-7xl mx-auto px-8 pt-6 flex justify-end">
              <HeaderTools user={user} onLogout={handleLogout} setCurrentPage={setCurrentPage} />
            </div>
          )}
          <div className="flex-grow pb-12">
            {renderPage()}
          </div>
        </main>

      </div>
    </ErrorBoundary>
  );
}

