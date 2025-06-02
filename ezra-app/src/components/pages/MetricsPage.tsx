import React from 'react';
import { mockMetrics } from '@/lib/mockData';
import { LineGraph } from '@/components/ui/LineGraph';
import { PieChart } from '@/components/ui/PieChart';
import { KeyMetricCard } from '@/components/ui/KeyMetricCard';

export const MetricsPage: React.FC = () => {
  const { autonomyOverTime, keyMetrics, autonomyBreakdown } = mockMetrics;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Performance Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineGraph data={autonomyOverTime} label="Autonomy Over Time (Past 4 Weeks)" />
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-3">Action Breakdown</h4>
          <PieChart 
            data={autonomyBreakdown}
            colors={{ auto: '#10B981', manual: '#3B82F6', snoozed: '#F59E0B' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {Object.entries(keyMetrics).map(([key, value]) => (
          <KeyMetricCard key={key} metricKey={key} value={value} />
        ))}
      </div>

      {/* Placeholder for Error Heatmap */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Error Heatmap (Conceptual)</h4>
        <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">(Heatmap visualization of errors by time/task type)</p>
        </div>
      </div>
    </div>
  );
};

export default MetricsPage;
