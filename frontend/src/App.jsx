import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeedbackForm from './pages/FeedbackForm';
import MeetingScheduler from './pages/MeetingScheduler';
import SentimentAnalysis from './pages/SentimentAnalysis';
import CommunicationHistory from './pages/CommunicationHistory';
import NoticeGenerator from './pages/NoticeGenerator';
import Reports from './pages/Reports';
import FeedbackDetail from './pages/FeedbackDetail';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedParentId, setSelectedParentId] = useState('');

  // Define backend connection endpoint.
  // In production, fallback to local origin since we serve the frontend bundle.
  const backendUrl = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:5001';

  const handleLoginSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken('');
    setCurrentPage('dashboard');
    setSelectedParentId('');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            setCurrentPage={setCurrentPage} 
            setSelectedParentId={setSelectedParentId} 
            backendUrl={backendUrl} 
          />
        );
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
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-darkBg text-[#4A433A] overflow-x-hidden">
      
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
      />

      {/* Main Content Area Panel */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-grow pb-12">
          {renderPage()}
        </div>
      </main>

    </div>
  );
}
