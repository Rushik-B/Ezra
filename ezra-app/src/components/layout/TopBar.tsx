'use client';

import React from 'react';
import { MessageCircle, Zap } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar/sidebar';

interface TopBarProps {
  onLogoClick?: () => void;
  onFeedbackClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onLogoClick, onFeedbackClick }) => {

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
          </div>
        </button>
      </div>

      <div className="flex items-center space-x-6">
        <button 
          onClick={onFeedbackClick}
          className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 transition-all duration-200 group shadow-md hover:shadow-lg cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
          <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800 transition-colors">
            Feedback
          </span>
        </button>
      </div>
    </div>
  );
}; 