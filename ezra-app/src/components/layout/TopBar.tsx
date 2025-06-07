'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ChevronDown, User, Settings as SettingsIcon, Briefcase, LogOut, Zap } from 'lucide-react';

interface TopBarProps {
  onLogoClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onLogoClick }) => {
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
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 h-16 flex items-center justify-between px-8 fixed top-0 left-0 right-0 z-50">
      <button 
        onClick={onLogoClick}
        className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
          <Zap className="text-white h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">EZRA</h1>
          <div className="text-xs text-slate-400 font-medium">AI Email Intelligence</div>
        </div>
      </button>

      <div className="flex items-center space-x-6">
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setProfileOpen(!profileOpen)} 
            className="flex items-center space-x-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center text-xs font-semibold text-white">
              {userInitials}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-white">{userName}</div>
              <div className="text-xs text-slate-400">Account</div>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:text-slate-300 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-sm font-semibold text-white">
                    {userInitials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{userName}</p>
                    <p className="text-xs text-slate-400">User Account</p>
                  </div>
                </div>
              </div>
              
              <div className="py-2">
                <a href="#" className="flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
                  <User size={16} className="mr-3 text-slate-400" /> 
                  Account Settings
                </a>
                <a href="#" className="flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
                  <Briefcase size={16} className="mr-3 text-slate-400" /> 
                  Integrations
                </a>
                <a href="#" className="flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
                  <SettingsIcon size={16} className="mr-3 text-slate-400" /> 
                  Preferences
                </a>
              </div>
              
              <div className="border-t border-slate-700/50 pt-2">
                <button 
                  onClick={() => signOut()}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} className="mr-3" /> 
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 