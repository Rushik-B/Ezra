import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Link from 'next/link';

type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
type WorkingHours = Record<DayKey, { start: string; end: string; active: boolean }>;

export const SettingsPage: React.FC = () => {
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    Mon: { start: '09:00', end: '17:00', active: true },
    Tue: { start: '09:00', end: '17:00', active: true },
    Wed: { start: '09:00', end: '17:00', active: true },
    Thu: { start: '09:00', end: '17:00', active: true },
    Fri: { start: '09:00', end: '17:00', active: true },
    Sat: { start: '10:00', end: '14:00', active: false },
    Sun: { start: '10:00', end: '14:00', active: false },
  });

  const handleHoursChange = (
    day: DayKey,
    field: 'start' | 'end' | 'active',
    value: string | boolean
  ) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
        Settings
      </h2>



      {/* Working Hours */}
      <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Working Hours
        </h3>
        <div className="space-y-2 max-w-md">
          {(Object.keys(workingHours) as DayKey[]).map(day => {
            const hrs = workingHours[day];
            return (
              <div
                key={day}
                className="flex items-center space-x-3 p-2 even:bg-gray-50 dark:even:bg-gray-700/50 rounded"
              >
                <label className="flex items-center space-x-2 w-24">
                  <input
                    type="checkbox"
                    checked={hrs.active}
                    onChange={e =>
                      handleHoursChange(day, 'active', e.target.checked)
                    }
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {day}
                  </span>
                </label>
                <input
                  type="time"
                  value={hrs.start}
                  disabled={!hrs.active}
                  onChange={e =>
                    handleHoursChange(day, 'start', e.target.value)
                  }
                  className={`w-24 p-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded ${
                    !hrs.active ? 'opacity-50 cursor-not-allowed' : ''
                  } focus:ring-emerald-500 focus:border-emerald-500`}
                />
                <span
                  className={`text-sm text-gray-500 dark:text-gray-400 ${
                    !hrs.active ? 'opacity-50' : ''
                  }`}
                >
                  to
                </span>
                <input
                  type="time"
                  value={hrs.end}
                  disabled={!hrs.active}
                  onChange={e =>
                    handleHoursChange(day, 'end', e.target.value)
                  }
                  className={`w-24 p-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded ${
                    !hrs.active ? 'opacity-50 cursor-not-allowed' : ''
                  } focus:ring-emerald-500 focus:border-emerald-500`}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Developer Tools */}
      <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Developer Tools
        </h3>
        <div className="space-y-3 max-w-md">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tools for testing and debugging application features.
          </p>
          <div className="flex space-x-2">
            <Link
              href="/tools/test-email"
              className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded shadow-sm cursor-pointer"
            >
              <Send size={14} className="mr-1" />
              Send Test Email
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
