'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ChevronDown, User, Settings as SettingsIcon, Briefcase, LogOut, Brain } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
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
      </div>

      <div className="flex items-center space-x-4">
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