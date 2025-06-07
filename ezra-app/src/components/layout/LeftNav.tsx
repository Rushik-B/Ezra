import React from 'react';
import { Inbox, Clock, BarChart3, Settings2, Settings as SettingsIcon } from 'lucide-react';
import { PageType } from '@/types';

interface LeftNavProps {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
}

export const LeftNav: React.FC<LeftNavProps> = ({ activePage, setActivePage }) => {
  const navItems = [
    { id: 'queue' as PageType, label: 'Inbox', icon: Inbox, description: 'Email management' },
    { id: 'history' as PageType, label: 'Activity', icon: Clock, description: 'Action history' },
    { id: 'metrics' as PageType, label: 'Analytics', icon: BarChart3, description: 'Performance insights' },
    { id: 'voice' as PageType, label: 'Voice and Rules Configuration', icon: Settings2, description: 'AI behavior settings' },
    { id: 'settings' as PageType, label: 'Settings', icon: SettingsIcon, description: 'System preferences' },
  ];

  return (
    <nav className="w-72 bg-slate-900/30 backdrop-blur-sm border-r border-slate-800/50 h-full fixed top-16 left-0">
      <div className="p-6 pt-8">
        <div className="space-y-1">
          {navItems.map(item => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full group flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200 
                  ${isActive 
                    ? 'bg-blue-600/20 text-blue-100 border-l-4 border-blue-500' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
              >
                <IconComponent className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {item.label}
                  </div>
                  <div className={`text-xs ${isActive ? 'text-blue-200' : 'text-slate-500 group-hover:text-slate-400'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom section */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm font-medium text-slate-300">Ezra AI</div>
              <div className="text-xs text-slate-500">Intelligent Email Assistant</div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}; 