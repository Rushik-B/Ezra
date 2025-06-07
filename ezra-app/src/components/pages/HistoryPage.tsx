'use client';

import React, { useState, useEffect } from 'react';
import { Search, History as HistoryIcon, RotateCcw, X, ShieldCheck, Trash2, Edit3, Clock, Settings, AlertTriangle, Inbox } from 'lucide-react';

interface HistoryItem {
  id: string;
  actionType: string;
  actionSummary: string;
  timestamp: string;
  fullContext: string;
  promptState: string;
  feedback: string;
  confidence?: number;
  undoable: boolean;
  emailReference?: string;
}

export const HistoryPage: React.FC = () => {
  const [filter, setFilter] = useState('7'); // Days filter: '1', '7', '30'
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistoryViewer, setShowHistoryViewer] = useState<HistoryItem | null>(null);

  // Fetch history items on component mount and when filters change
  useEffect(() => {
    fetchHistoryItems();
  }, [filter, actionTypeFilter]);

  const fetchHistoryItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        days: filter,
        actionType: actionTypeFilter
      });
      
      const response = await fetch(`/api/action-history?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setHistoryItems(data.historyItems || []);
      } else {
        console.error('Failed to fetch history items:', data.error);
        setHistoryItems([]);
      }
    } catch (error) {
      console.error('Error fetching history items:', error);
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = historyItems.filter(item => {
    if (searchTerm && !item.actionSummary.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  const handleUndo = (itemId: string) => {
    console.log(`Undo action for ${itemId}`);
    // TODO: Implement undo functionality
  };

  // Get icon for action type
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'EMAIL_SENT':
        return <ShieldCheck className="text-emerald-500" size={16} />;
      case 'EMAIL_EDITED':
        return <Edit3 className="text-blue-500" size={16} />;
      case 'EMAIL_REJECTED':
        return <Trash2 className="text-red-500" size={16} />;
      case 'EMAIL_SNOOZED':
        return <Clock className="text-yellow-500" size={16} />;
      case 'MASTER_PROMPT_UPDATED':
        return <Settings className="text-purple-500" size={16} />;
      default:
        return <AlertTriangle className="text-gray-500" size={16} />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // History Viewer Component (similar to EmailViewer in QueuePage)
  const HistoryViewer: React.FC<{ item: HistoryItem; onClose: () => void }> = ({ item, onClose }) => {
    const actionDetails = JSON.parse(item.fullContext || '{}');
    
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
              {getActionIcon(item.actionType)}
              <span className="ml-2">Action Details - {item.actionType.replace('_', ' ')}</span>
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              <X size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Email */}
            {actionDetails.emailFrom && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                    <Inbox size={18} className="mr-2" />
                    Original Email
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>From:</strong> {actionDetails.emailFrom}</div>
                    <div><strong>Subject:</strong> {actionDetails.emailSubject}</div>
                    <div><strong>Action:</strong> {item.actionSummary}</div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Response / Action Details */}
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                <h4 className="text-lg font-medium text-emerald-800 dark:text-emerald-200 mb-3 flex items-center">
                  {getActionIcon(item.actionType)}
                  <span className="ml-2">Action Result</span>
                  {item.confidence && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      item.confidence >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      item.confidence >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {item.confidence}% confidence
                    </span>
                  )}
                </h4>
                {actionDetails.finalContent && (
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border max-h-64 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                      {actionDetails.finalContent}
                    </div>
                  </div>
                )}
                {actionDetails.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded border">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>Rejection Reason:</strong> {actionDetails.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Details */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Action Context:</h4>
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap">
              {item.fullContext}
            </pre>
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const HistoryItemModal: React.FC<{ item: HistoryItem; onClose: () => void }> = ({ item, onClose }) => (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            {getActionIcon(item.actionType)}
            <span className="ml-2">Action Details</span>
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <strong className="text-gray-600 dark:text-gray-300">Action Type:</strong> 
            <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">{item.actionType}</span>
          </div>
          <div>
            <strong className="text-gray-600 dark:text-gray-300">Summary:</strong> 
            <p className="mt-1">{item.actionSummary}</p>
          </div>
          <div>
            <strong className="text-gray-600 dark:text-gray-300">Timestamp:</strong> 
            <p className="mt-1">{new Date(item.timestamp).toLocaleString()}</p>
          </div>
          {item.confidence && (
            <div>
              <strong className="text-gray-600 dark:text-gray-300">AI Confidence:</strong> 
              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                {item.confidence}%
              </span>
            </div>
          )}
          <div>
            <strong className="text-gray-600 dark:text-gray-300">Full Context:</strong>
            <pre className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto whitespace-pre-wrap">
              {item.fullContext}
            </pre>
          </div>
          <div>
            <strong className="text-gray-600 dark:text-gray-300">Additional Details:</strong>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.feedback}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-md shadow-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Action History</h2>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 md:space-x-4">
        <div className="flex items-center space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {['1', '7', '30'].map(days => (
            <button
              key={days}
              onClick={() => setFilter(days)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150
                ${filter === days 
                  ? 'bg-emerald-500 text-white shadow' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {days === '1' ? 'Today' : days === '7' ? 'This Week' : 'This Month'}
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
            <option value="rejected">Rejected</option>
            <option value="snoozed">Snoozed</option>
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
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Loading action history...</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredHistory.length > 0 ? filteredHistory.map(item => (
              <li key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-l-4 hover:border-l-blue-500 transition-all duration-150 cursor-pointer" onClick={() => setShowHistoryViewer(item)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0">{getActionIcon(item.actionType)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{item.actionSummary}</p>
                                             <div className="flex items-center space-x-2 mt-1">
                         <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(item.timestamp)}</p>
                         {item.confidence && (
                           <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                             {item.confidence}% confidence
                           </span>
                         )}
                         <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                           Click to view details →
                         </span>
                       </div>
                    </div>
                  </div>
                                     {item.undoable && ['EMAIL_SENT', 'EMAIL_EDITED'].includes(item.actionType) && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); setSelectedHistoryItem(item); }} 
                       className="text-xs text-blue-600 dark:text-blue-400 hover:underline p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 flex items-center"
                     >
                       <RotateCcw size={14} className="mr-1" />
                       Undo Options
                     </button>
                   )}
                </div>
              </li>
            )) : (
              <li className="p-8 text-center">
                <HistoryIcon size={36} className="mx-auto text-gray-400 dark:text-gray-500" />
                <p className="mt-3 text-md font-medium text-gray-600 dark:text-gray-300">No History Found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Try adjusting your search term.' : 'No actions recorded in the selected time period.'}
                </p>
              </li>
            )}
          </ul>
        )}
      </div>
      
      {showHistoryViewer && (
        <HistoryViewer 
          item={showHistoryViewer} 
          onClose={() => setShowHistoryViewer(null)} 
        />
      )}

      {selectedHistoryItem && (
        <HistoryItemModal 
          item={selectedHistoryItem} 
          onClose={() => setSelectedHistoryItem(null)} 
        />
      )}
    </div>
  );
}; 