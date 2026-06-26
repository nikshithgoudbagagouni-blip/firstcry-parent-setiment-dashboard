import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Smile, 
  Flame, 
  Calendar, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Mail, 
  CalendarPlus, 
  Loader2,
  RefreshCw,
  Search,
  MessageSquare
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import StatCard from '../components/StatCard';

export default function Dashboard({ setCurrentPage, setSelectedParentId, backendUrl }) {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, trendsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/dashboard`),
        axios.get(`${backendUrl}/api/analytics/trends`)
      ]);
      setData(dashRes.data);
      setTrends(trendsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard summary data:', err);
      setError('Could not connect to the Express services. Please verify backend status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleActionClick = (tab, parentId) => {
    setSelectedParentId(parentId);
    setCurrentPage(tab);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Aggregating real-time parent metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="glass-panel p-8 max-w-md text-center border-rose-500/20">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Service Offline</h3>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button onClick={fetchDashboardData} className="btn-primary w-full">
            <RefreshCw className="h-4 w-4" /> Try Reconnecting
          </button>
        </div>
      </div>
    );
  }

  const {
    totalFeedback = 0,
    positiveCount = 0,
    negativeCount = 0,
    neutralCount = 0,
    avgSentiment = 0,
    avgEngagement = 0,
    scheduledMeetingsCount = 0,
    highRiskParents = [],
    recentActivities = []
  } = data || {};

  // Extract top keywords for word cloud list
  const aggregatedConcerns = {};
  trends.forEach(t => {
    t.keyConcerns?.forEach(c => {
      aggregatedConcerns[c.keyword] = (aggregatedConcerns[c.keyword] || 0) + c.count;
    });
  });

  const concernsList = Object.keys(aggregatedConcerns).map(k => ({
    keyword: k,
    count: aggregatedConcerns[k]
  })).sort((a, b) => b.count - a.count);

  const filteredRisks = highRiskParents.filter(p => 
    p.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
    p.childName.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Console Overview</h2>
          <p className="text-slate-400 text-sm mt-1">FirstCry Intellitots Center Sentiment Analytics Engine</p>
        </div>
        <button onClick={fetchDashboardData} className="btn-secondary py-2">
          <RefreshCw className="h-4 w-4" /> Sync Logs
        </button>
      </div>

      {/* Stats Cards Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Average Sentiment" 
          value={`${avgSentiment > 0 ? '+' : ''}${avgSentiment}`} 
          icon={Smile} 
          change="+8.3%" 
          trend="up" 
          color="indigo" 
        />
        <StatCard 
          title="Engagement index" 
          value={`${avgEngagement}/100`} 
          icon={Activity} 
          change="+14.2%" 
          trend="up" 
          color="teal" 
        />
        <StatCard 
          title="At-Risk Parents" 
          value={highRiskParents.length} 
          icon={Flame} 
          change={highRiskParents.length > 0 ? "Dropping" : "Stable"} 
          trend={highRiskParents.length > 0 ? "down" : "neutral"} 
          color="rose" 
        />
        <StatCard 
          title="Open Meetings" 
          value={scheduledMeetingsCount} 
          icon={Calendar} 
          change="Upcoming" 
          trend="neutral" 
          color="amber" 
        />
      </div>

      {/* Main Graph & Keyword Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sentiment & Engagement Timeseries Graph */}
        <div className="glass-panel p-6 lg:col-span-2 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Sentiment vs. Engagement Index</h3>
              <p className="text-slate-400 text-xs mt-0.5">Tracking daily fluctuations of parent responses</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Sentiment (-1 to 1)
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> Engagement (0-100)
              </span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6DDD0" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#7D7263" 
                  fontSize={10}
                  tickFormatter={(tick) => {
                    const parts = tick.split('-');
                    return parts.length > 2 ? `${parts[1]}/${parts[2]}` : tick;
                  }}
                />
                <YAxis yAxisId="left" stroke="#FF8562" fontSize={10} domain={[-1, 1]} />
                <YAxis yAxisId="right" orientation="right" stroke="#88B097" fontSize={10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#E6DDD0', 
                    borderRadius: '12px',
                    color: '#4A433A',
                    fontSize: '12px'
                  }}
                />
                <Area yAxisId="left" type="monotone" dataKey="avgSentimentScore" name="Avg Sentiment" stroke="#FF8562" strokeWidth={2} fillOpacity={1} fill="url(#colorSentiment)" />
                <Area yAxisId="right" type="monotone" dataKey="avgEngagementIndex" name="Avg Engagement" stroke="#88B097" strokeWidth={2} fillOpacity={1} fill="url(#colorEngagement)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Word Cloud / Concern Tracker List */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Top Parent Concerns</h3>
            <p className="text-slate-400 text-xs mb-6">Topic tag occurrence rate extracted via NLP</p>
            
            <div className="space-y-4">
              {concernsList.length > 0 ? (
                concernsList.slice(0, 6).map((item, idx) => (
                  <div key={item.keyword} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-200">{item.keyword}</span>
                      <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">{item.count} items</span>
                    </div>
                    <div className="w-full bg-[#FCFAF7] border border-[#E6DDD0]/60 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${idx % 2 === 0 ? 'from-[#FF8562] to-[#FF6B4A]' : 'from-[#88B097] to-[#FF8562]'}`} 
                        style={{ width: `${Math.min(item.count * 20, 100)}%` }} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 text-sm py-12">No concern topics detected.</div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-[#E6DDD0]/65 mt-6 flex justify-between items-center text-xs font-semibold text-[#FF8562] cursor-pointer hover:underline" onClick={() => setCurrentPage('sentiment-analysis')}>
            <span>Run manual sentiment checks</span>
            <span>→</span>
          </div>
        </div>

      </div>

      {/* Alerts (High-Risk Parents) & Recent Timeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* High-Risk Parent Alerts Panel */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">At-Risk Parents Tracker</h3>
                <p className="text-slate-400 text-xs mt-0.5">Identified for dropping sentiment or complaints</p>
              </div>
              <div className="relative w-44">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter parents..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#FCFAF7] border border-[#E6DDD0] rounded-lg text-xs focus:outline-none focus:border-[#FF8562] text-[#4A433A] placeholder-[#9E9588]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-450 border-b border-[#E6DDD0]/60 pb-3 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Parent / Child</th>
                    <th className="pb-3">Class</th>
                    <th className="pb-3">Sentiment</th>
                    <th className="pb-3">Engagement</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]/30">
                  {filteredRisks.length > 0 ? (
                    filteredRisks.map((parent) => (
                      <tr key={parent.id} className="group hover:bg-[#FCFAF7]">
                        <td className="py-3.5 pr-2">
                          <button
                            onClick={() => handleActionClick('feedback-detail', parent.id)}
                            className="font-bold text-[#4A433A] hover:text-[#FF8562] text-left transition-colors duration-150 cursor-pointer"
                          >
                            {parent.name}
                          </button>
                          <p className="text-slate-400 text-[10px] mt-0.5">Child: {parent.childName}</p>
                        </td>
                        <td className="py-3.5 pr-2 text-[#4A433A]">{parent.classGrade || 'Nursery'}</td>
                        <td className="py-3.5 pr-2">
                          <span className={`badge-negative animate-pulse`}>
                            {parent.latestSentimentLabel || 'Negative'} ({parent.latestSentimentScore})
                          </span>
                        </td>
                        <td className="py-3.5 pr-2">
                          <span className="font-semibold text-[#4A433A]">{parent.engagementIndex}/100</span>
                        </td>
                        <td className="py-3.5 text-right flex items-center justify-end gap-1">
                          <button
                            title="View Full Profile Details"
                            onClick={() => handleActionClick('feedback-detail', parent.id)}
                            className="p-1.5 text-[#7D7263] hover:text-[#88B097] hover:bg-[#FAF7F2] rounded-lg transition-colors duration-150 cursor-pointer"
                          >
                            <Search className="h-4 w-4" />
                          </button>
                          <button
                            title="Generate Alert Notice"
                            onClick={() => handleActionClick('notice-generator', parent.id)}
                            className="p-1.5 text-[#7D7263] hover:text-[#FF8562] hover:bg-[#FAF7F2] rounded-lg transition-colors duration-150 cursor-pointer"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
                            title="Schedule Proactive Meeting"
                            onClick={() => handleActionClick('meeting-scheduler', parent.id)}
                            className="p-1.5 text-[#7D7263] hover:text-[#FF8562] hover:bg-[#FAF7F2] rounded-lg transition-colors duration-150 cursor-pointer"
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500 font-medium">
                        No at-risk parents detected. Great job!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent timeline list */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white mb-1">Recent Activities</h3>
          <p className="text-slate-400 text-xs mb-6">Latest feed of meetings & messages</p>

          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#E6DDD0]">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act.id} className="flex gap-4 relative">
                  <div className={`h-6 w-6 rounded-full border border-[#E6DDD0] bg-[#FCFAF7] flex items-center justify-center shrink-0 z-10 ${
                    act.type === 'meeting' ? 'text-[#88B097]' : 'text-[#FF8562]'
                  }`}>
                    {act.type === 'meeting' ? (
                      <Calendar className="h-3 w-3" />
                    ) : (
                      <MessageSquare className="h-3 w-3" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{act.title}</h4>
                    <p className="text-slate-450 text-[10px] mt-0.5 truncate max-w-[180px]">{act.description}</p>
                    <span className="text-[9px] text-slate-500 block mt-1 font-medium">
                      {new Date(act.timestamp).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 text-xs py-12">No recent log actions.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
