'use client';

import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
  const [visible, setVisible] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)} // For touch devices
      >
        {children}
      </div>
      {visible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700 whitespace-nowrap ${positionClasses[position]}`}
        >
          {text}
          <div className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 ${
            position === 'top' ? 'left-1/2 -translate-x-1/2 top-full -mt-1' :
            position === 'bottom' ? 'left-1/2 -translate-x-1/2 bottom-full -mb-1' :
            position === 'left' ? 'top-1/2 -translate-y-1/2 left-full -ml-1' :
            'top-1/2 -translate-y-1/2 right-full -mr-1'
          }`}></div>
        </div>
      )}
    </div>
  );
}; 