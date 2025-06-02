'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ChevronDown, Search, User, Settings as SettingsIcon, Briefcase, LogOut, Brain } from 'lucide-react';

interface TopBarProps {
  autonomy: number;
  setAutonomy: (value: number) => void;
  onSearch: (term: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ autonomy, setAutonomy, onSearch }) => {
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const autonomyLevels = {
    0: 'Suggest',
    50: 'Hybrid',
    100: 'Autopilot'
  };

  const getAutonomyLabel = (value: number): string => {
    if (value >= 95) return autonomyLevels[100];
    if (value >= 45 && value <= 55) return autonomyLevels[50];
    if (value <= 5) return autonomyLevels[0];
    return `${value}%`;
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Use actual user name from session or fallback
  const userName = session?.user?.name || 'User';
  const userAvatar = session?.user?.image || `https://placehold.co/40x40/E0E7FF/4F46E5?text=${userName.charAt(0)}`;

  return (
    <div className="bg-white dark:bg-gray-900 h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center">
        <Brain className="text-emerald-500 h-8 w-8 mr-2" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">EZRA</h1>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-4"></div>
        <div className="flex items-center space-x-3 min-w-[200px]">
          <label htmlFor="autonomy" className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Autonomy:</label>
          <div className="relative w-full">
            <input
              id="autonomy"
              type="range"
              min="0"
              max="100"
              value={autonomy}
              onChange={(e) => setAutonomy(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span className={`cursor-pointer ${autonomy <= 5 ? 'text-emerald-500 font-semibold' : ''}`} onClick={() => setAutonomy(0)}>Suggest</span>
              <span className={`cursor-pointer ${autonomy >= 45 && autonomy <= 55 ? 'text-emerald-500 font-semibold' : ''}`} onClick={() => setAutonomy(50)}>Hybrid</span>
              <span className={`cursor-pointer ${autonomy >= 95 ? 'text-emerald-500 font-semibold' : ''}`} onClick={() => setAutonomy(100)}>Autopilot</span>
            </div>
             <div 
                className="absolute text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                style={{ left: `calc(${autonomy}% - ${autonomy/100 * 10}px)`, top: '-18px' }}
              >
                {getAutonomyLabel(autonomy)}
              </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="search"
            placeholder="Search actions, threads, rules..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none">
            <img src={userAvatar} alt="User Avatar" className="h-8 w-8 rounded-full border-2 border-emerald-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:inline">{userName}</span>
            <ChevronDown className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-xl z-50 border border-gray-200 dark:border-gray-700 py-1">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{userName}</p>
                <p className="text-xs text-emerald-500">Online</p>
              </div>
              <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <User size={16} className="mr-2" /> Profile
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Briefcase size={16} className="mr-2" /> Integrations
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <SettingsIcon size={16} className="mr-2" /> Settings
              </a>
              <div className="my-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              <button 
                onClick={() => signOut()}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
              >
                <LogOut size={16} className="mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 