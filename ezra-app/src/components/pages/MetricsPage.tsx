import React, { useState } from 'react';
import { BarChart, TrendingUp } from 'lucide-react';

export const MetricsPage: React.FC = () => {
  const [blurLevel, setBlurLevel] = useState(8); // Adjustable blur level

  return (
    <div className="p-6 space-y-6 relative">
      {/* Blur Control */}
      <div className="absolute top-4 right-4 z-20 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
          Blur Level: {blurLevel}px
        </label>
        <input
          type="range"
          min="0"
          max="20"
          value={blurLevel}
          onChange={(e) => setBlurLevel(parseInt(e.target.value))}
          className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Blurred Content */}
      <div 
        className="transition-all duration-300 ease-in-out"
        style={{ filter: `blur(${blurLevel}px)` }}
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Performance Metrics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-3">Email Response Rate Over Time</h4>
              <div className="h-64 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900 dark:to-blue-900 rounded flex items-center justify-center">
                <BarChart size={48} className="text-emerald-500" />
              </div>
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-3">Action Breakdown</h4>
            <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded flex items-center justify-center">
              <TrendingUp size={32} className="text-blue-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { label: 'Emails Handled', value: '157' },
            { label: 'Avg Confidence', value: '78%' },
            { label: 'Time Saved', value: '4h 30m' },
            { label: 'Error Rate', value: '2.5%' },
            { label: 'Edits Needed', value: '18' }
          ].map((metric, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{metric.label}</div>
              <div className="text-lg font-semibold text-gray-800 dark:text-white">{metric.value}</div>
            </div>
          ))}
        </div>

        {/* Placeholder for Error Heatmap */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Performance Heatmap</h4>
          <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded flex items-center justify-center">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-6 h-6 rounded ${
                    Math.random() > 0.7 ? 'bg-emerald-500' : 
                    Math.random() > 0.4 ? 'bg-yellow-500' : 'bg-gray-300'
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 text-center max-w-md mx-4">
          <div className="mb-4">
            <TrendingUp size={48} className="mx-auto text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
            Advanced Analytics
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Comprehensive performance metrics, AI insights, and detailed analytics are coming soon.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full text-sm font-medium">
            🚀 Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPage;
