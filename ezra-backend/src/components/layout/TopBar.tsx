'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ChevronDown, User, Settings as SettingsIcon, Briefcase, LogOut, Zap } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar/sidebar';

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
    <div className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 fixed top-0 left-0 right-0 z-50 shadow-elegant">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="md:hidden text-gray-600 hover:text-gray-900" />
        <button 
          onClick={onLogoClick}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-elegant">
            <Zap className="text-white h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">EZRA</h1>
            <div className="text-xs text-gray-500 font-medium">AI Email Intelligence</div>
          </div>
        </button>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setProfileOpen(!profileOpen)} 
            className="flex items-center space-x-3 p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 group shadow-elegant cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center text-xs font-semibold text-white shadow-elegant">
              {userInitials}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500">Account</div>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 group-hover:text-gray-700 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-elegant-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center text-sm font-semibold text-white shadow-elegant">
                    {userInitials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500">User Account</p>
                  </div>
                </div>
              </div>
              
              <div className="py-2">
                <a href="#" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer">
                  <User size={16} className="mr-3 text-gray-500" /> 
                  Account Settings
                </a>
                <a href="#" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer">
                  <Briefcase size={16} className="mr-3 text-gray-500" /> 
                  Integrations
                </a>
                <a href="#" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer">
                  <SettingsIcon size={16} className="mr-3 text-gray-500" /> 
                  Preferences
                </a>
              </div>
              
              <div className="border-t border-gray-100 pt-2">
                <button 
                  onClick={() => signOut()}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
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