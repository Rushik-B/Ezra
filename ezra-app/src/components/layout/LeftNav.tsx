import React from 'react';
import { ListChecks, History as HistoryIcon, BarChart2, Volume2, Settings as SettingsIcon } from 'lucide-react';
import { PageType } from '@/types';

interface LeftNavProps {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
}

export const LeftNav: React.FC<LeftNavProps> = ({ activePage, setActivePage }) => {
  const navItems = [
    { id: 'queue' as PageType, label: 'Queue', icon: ListChecks },
    { id: 'history' as PageType, label: 'History', icon: HistoryIcon },
    { id: 'metrics' as PageType, label: 'Metrics', icon: BarChart2 },
    { id: 'voice' as PageType, label: 'Voice & Rules', icon: Volume2 },
    { id: 'settings' as PageType, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav className="w-64 bg-white dark:bg-gray-900 h-full fixed top-16 left-0 border-r border-gray-200 dark:border-gray-700 p-4 space-y-2 pt-6">
      {navItems.map(item => {
        const IconComponent = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out
              ${activePage === item.id 
                ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-600' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <IconComponent className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}; 