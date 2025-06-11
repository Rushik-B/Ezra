import React, { useState } from 'react';
import { BarChart3, TrendingUp, Activity, Target, Clock } from 'lucide-react';

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
    <div className="relative">
      {/* Blurred content */}
      <div className="blur-sm opacity-30 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Performance Analytics
            </h1>
            <p className="text-gray-600 max-w-2xl leading-relaxed">
              Comprehensive insights into your AI assistant&apos;s performance and impact
            </p>
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl p-1.5 mt-6 lg:mt-0 shadow-elegant">
            {['24h', '7d', '30d', '90d'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-elegant'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
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
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-elegant">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-gray-700 font-medium">Total Emails</h3>
              </div>
              <div className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                +12.5%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metrics.totalEmails.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              Processed this month
            </div>
          </div>

          {/* Average Performance */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-elegant">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-gray-700 font-medium">Performance</h3>
              </div>
              <div className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                +3.2%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metrics.averageConfidence}%
            </div>
            <div className="text-sm text-gray-500">
              AI response accuracy
            </div>
          </div>

          {/* Time Saved */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-elegant">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-gray-700 font-medium">Time Saved</h3>
              </div>
              <div className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                +18.7%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metrics.timeSaved}
            </div>
            <div className="text-sm text-gray-500">
              Automated processing
            </div>
          </div>
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Trend */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-elegant">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-3 text-blue-600" />
                Performance Trend
              </h3>
              <div className="text-sm text-gray-500">
                Last 7 days
              </div>
            </div>
            
            {/* Simple chart visualization */}
            <div className="h-48 flex items-end space-x-2">
              {weeklyData.map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-700"
                    style={{ height: `${(value / 100) * 160}px` }}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">Performance Score</span>
              <span className="text-emerald-600 font-medium">+5.2% vs last week</span>
            </div>
          </div>

          {/* Action Breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-elegant">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-3 text-blue-600" />
                Action Breakdown
              </h3>
              <div className="text-sm text-gray-500">
                This week
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-gray-700">Auto-approved</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900 font-medium">78.5%</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-emerald-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-gray-700">Needs Review</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900 font-medium">15.2%</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-1/6 h-full bg-amber-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Rejected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900 font-medium">4.1%</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-1/12 h-full bg-red-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Manual Edit</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900 font-medium">2.2%</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-1/12 h-full bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="text-center bg-white rounded-3xl shadow-elegant-lg border border-gray-200 p-12 max-w-md mx-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-elegant">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Analytics Dashboard
          </h2>
          <p className="text-lg text-gray-700 mb-2">
            Coming Soon 👀
          </p>
          <p className="text-sm text-gray-500">
            We&apos;re building powerful insights and analytics to help you understand your AI&apos;s performance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetricsPage;
