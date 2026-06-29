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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(savedSession.token && savedSession.user));
  const [user, setUser] = useState(savedSession.user || null);
  const [token, setToken] = useState(savedSession.token || '');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedParentId, setSelectedParentId] = useState('');

  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem('firstcry-backend-url') || import.meta.env.VITE_API_URL || 'https://firstcry-parent-setiment-dashboard.onrender.com';
  });

  const handleLoginSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    axios.defaults.headers.common.Authorization = `Bearer ${userToken}`;
    localStorage.setItem('firstcry-session', JSON.stringify({ token: userToken, user: userData }));
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = useCallback((notifyServer = true) => {
    if (notifyServer && token) axios.post(`${backendUrl}/api/auth/logout`).catch(() => {});
    setIsAuthenticated(false);
    setUser(null);
    setToken('');
    setCurrentPage('dashboard');
    setSelectedParentId('');
    delete axios.defaults.headers.common.Authorization;
    localStorage.removeItem('firstcry-session');
  }, [backendUrl, token]);

  const handleSwitchRole = async (role) => {
    let email = 'admin@firstcry.com';
    let password = 'admin';
    if (role === 'teacher') {
      email = 'priya@firstcry.com';
      password = 'teacher';
    } else if (role === 'parent') {
      email = 'rahul.sharma@example.com';
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
    axios.get(`${backendUrl}/api/auth/me`).then(({ data }) => {
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
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        backendUrl={backendUrl} 
        setBackendUrl={(url) => {
          localStorage.setItem('firstcry-backend-url', url);
          setBackendUrl(url);
        }}
      />
    );
  }

  return (
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
  );
}
