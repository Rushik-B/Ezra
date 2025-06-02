'use client';

import React, { useState } from 'react';
import { Search, History as HistoryIcon, RotateCcw, X } from 'lucide-react';
import { HistoryItem } from '@/types';
import { mockHistoryItems } from '@/lib/mockData';

export const HistoryPage: React.FC = () => {
  const [filter, setFilter] = useState('today');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

  const filteredHistory = mockHistoryItems.filter(item => {
    if (actionTypeFilter !== 'all' && !item.summary.toLowerCase().includes(actionTypeFilter.slice(0, -2))) {
      if (actionTypeFilter === 'sent' && !(item.summary.toLowerCase().includes('replied') || item.summary.toLowerCase().includes('sent') || item.summary.toLowerCase().includes('archived'))) return false;
      if (actionTypeFilter === 'snoozed' && !item.summary.toLowerCase().includes('snoozed')) return false;
      if (actionTypeFilter === 'rejected' && !item.summary.toLowerCase().includes('rejected')) return false;
    }
    if (searchTerm && !item.summary.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  const handleUndo = (itemId: string) => {
    console.log(`Undo action for ${itemId}`);
  };

  const HistoryItemModal: React.FC<{ item: HistoryItem; onClose: () => void }> = ({ item, onClose }) => (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Action Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"><X size={24} /></button>
        </div>
        <div className="space-y-3 text-sm">
          <p><strong className="text-gray-600 dark:text-gray-300">Summary:</strong> {item.summary}</p>
          <p><strong className="text-gray-600 dark:text-gray-300">Timestamp:</strong> {item.timestamp}</p>
          <p><strong className="text-gray-600 dark:text-gray-300">Full Context:</strong> {item.fullContext}</p>
          <p><strong className="text-gray-600 dark:text-gray-300">Prompt State (at time of action):</strong> {item.promptState}</p>
          <p><strong className="text-gray-600 dark:text-gray-300">Feedback Provided:</strong> {item.feedback}</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-md shadow-sm">Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Action History</h2>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 md:space-x-4">
        <div className="flex items-center space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {['today', 'week', 'custom'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150
                ${filter === f 
                  ? 'bg-emerald-500 text-white shadow' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'week' ? '(This Week)' : f === 'custom' ? 'Range' : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
            <select 
                value={actionTypeFilter} 
                onChange={(e) => setActionTypeFilter(e.target.value)}
                className="text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 focus:ring-emerald-500 focus:border-emerald-500 text-gray-700 dark:text-gray-200"
            >
                <option value="all">All Action Types</option>
                <option value="sent">Sent/Replied</option>
                <option value="snoozed">Snoozed</option>
                <option value="rejected">Rejected</option>
            </select>
            <div className="relative w-full md:w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input 
                type="text" 
                placeholder="Filter history..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredHistory.length > 0 ? filteredHistory.map(item => (
            <li key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer" onClick={() => setSelectedHistoryItem(item)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="flex-shrink-0">{item.statusIcon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{item.summary}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.timestamp}</p>
                  </div>
                </div>
                { (item.summary.toLowerCase().includes('replied') || item.summary.toLowerCase().includes('sent')) && 
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleUndo(item.id); }} 
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
                  >
                    <RotateCcw size={16} />
                  </button>
                }
              </div>
            </li>
          )) : (
            <li className="p-8 text-center">
              <HistoryIcon size={36} className="mx-auto text-gray-400 dark:text-gray-500" />
              <p className="mt-3 text-md font-medium text-gray-600 dark:text-gray-300">No History Found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or search term.</p>
            </li>
          )}
        </ul>
      </div>
      {selectedHistoryItem && <HistoryItemModal item={selectedHistoryItem} onClose={() => setSelectedHistoryItem(null)} />}
    </div>
  );
}; 