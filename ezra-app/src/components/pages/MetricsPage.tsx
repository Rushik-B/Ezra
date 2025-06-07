import React, { useState } from 'react';
import { BarChart3, TrendingUp, Activity, Zap, Target, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export const MetricsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data for the dashboard
  const metrics = {
    totalEmails: 2847,
    averageConfidence: 87,
    timeSaved: '142h',
    responseRate: 94.2,
    errorRate: 1.8,
    automationRate: 78.5
  };

  const weeklyData = [82, 89, 78, 91, 85, 88, 94];

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Blurred content */}
      <div className="blur-sm opacity-30 p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-2">
                Performance Analytics
              </h1>
              <p className="text-slate-400 max-w-2xl leading-relaxed">
                Comprehensive insights into your AI assistant's performance and impact
              </p>
            </div>
            
            <div className="flex items-center space-x-2 bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-xl p-1.5 mt-6 lg:mt-0">
              {['24h', '7d', '30d', '90d'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    timeRange === range
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Emails Processed */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-slate-300 font-medium">Total Emails</h3>
                </div>
                <div className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                  +12.5%
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics.totalEmails.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">
                Processed this month
              </div>
            </div>

            {/* Average Performance */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-slate-300 font-medium">Performance</h3>
                </div>
                <div className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                  +3.2%
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics.averageConfidence}%
              </div>
              <div className="text-sm text-slate-400">
                AI response accuracy
              </div>
            </div>

            {/* Time Saved */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-slate-300 font-medium">Time Saved</h3>
                </div>
                <div className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                  +18.7%
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics.timeSaved}
              </div>
              <div className="text-sm text-slate-400">
                Automated processing
              </div>
            </div>
          </div>

          {/* Charts and Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Trend */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-3 text-blue-400" />
                  Performance Trend
                </h3>
                <div className="text-sm text-slate-400">
                  Last 7 days
                </div>
              </div>
              
              {/* Simple chart visualization */}
              <div className="h-48 flex items-end space-x-2">
                {weeklyData.map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500/60 to-blue-500/60 rounded-t-lg transition-all duration-300 hover:from-blue-500 hover:to-blue-500"
                      style={{ height: `${(value / 100) * 160}px` }}
                    />
                    <div className="text-xs text-slate-400 mt-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-400">Performance Score</span>
                <span className="text-emerald-400 font-medium">+5.2% vs last week</span>
              </div>
            </div>

            {/* Action Breakdown */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-3 text-blue-400" />
                  Action Breakdown
                </h3>
                <div className="text-sm text-slate-400">
                  This week
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                    <span className="text-slate-300">Auto-approved</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">78.5%</span>
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-emerald-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-slate-300">Needs Review</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">15.2%</span>
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-1/6 h-full bg-yellow-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-slate-300">Rejected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">4.1%</span>
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-1/12 h-full bg-red-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-slate-300">Manual Edit</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">2.2%</span>
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-1/12 h-full bg-blue-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm">
        <div className="text-center bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-12 max-w-md mx-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Analytics Dashboard
          </h2>
          <p className="text-lg text-slate-300 mb-2">
            Coming Soon 👀
          </p>
          <p className="text-sm text-slate-400">
            We're building powerful insights and analytics to help you understand your AI's performance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetricsPage;
