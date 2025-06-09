'use client';

import React, { useState, useEffect } from 'react';
import { Search, Clock, RotateCcw, X, ShieldCheck, Trash2, Edit3, Settings, AlertTriangle, Mail, Filter, ArrowRight } from 'lucide-react';

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
        return <ShieldCheck className="text-emerald-600" size={16} />;
      case 'EMAIL_EDITED':
        return <Edit3 className="text-blue-600" size={16} />;
      case 'EMAIL_REJECTED':
        return <Trash2 className="text-red-600" size={16} />;
      case 'EMAIL_SNOOZED':
        return <Clock className="text-amber-600" size={16} />;
      case 'MASTER_PROMPT_UPDATED':
        return <Settings className="text-purple-600" size={16} />;
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-elegant-lg border border-gray-200 p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              {getActionIcon(item.actionType)}
              <span className="ml-3">Action Details - {item.actionType.replace('_', ' ')}</span>
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <X size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Original Email */}
            {actionDetails.emailFrom && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-elegant">
                  <h4 className="text-lg font-medium text-blue-700 mb-4 flex items-center">
                    <Mail size={18} className="mr-3" />
                    Original Email
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-20">From:</span>
                      <span className="text-gray-900">{actionDetails.emailFrom}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-20">Subject:</span>
                      <span className="text-gray-900">{actionDetails.emailSubject}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-20">Action:</span>
                      <span className="text-gray-700">{item.actionSummary}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Response / Action Details */}
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-elegant">
                <h4 className="text-lg font-medium text-emerald-700 mb-4 flex items-center">
                  {getActionIcon(item.actionType)}
                  <span className="ml-3">Action Result</span>
                </h4>
                {actionDetails.finalContent && (
                  <div className="mt-6 p-4 bg-white rounded-lg border border-emerald-200 max-h-64 overflow-y-auto shadow-elegant">
                    <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                      {actionDetails.finalContent}
                    </div>
                  </div>
                )}
                {actionDetails.rejectionReason && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Rejection Reason:</strong> {actionDetails.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Details */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-elegant">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Full Action Context:</h4>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-green-400 whitespace-pre font-mono leading-relaxed">
                {(() => {
                  try {
                    const parsed = JSON.parse(item.fullContext || '{}');
                    return JSON.stringify(parsed, null, 2);
                  } catch {
                    return item.fullContext;
                  }
                })()}
              </pre>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-8 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors shadow-elegant cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 w-full max-w-none">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
        <div className="flex-1 mb-6 lg:mb-0">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Activity History
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Track all AI actions and decisions. Review past performance and analyze patterns.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Time Range Filter */}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl p-1.5 shadow-elegant">
            {['1', '7', '30'].map(days => (
              <button
                key={days}
                onClick={() => setFilter(days)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                  filter === days 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-elegant' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {days === '1' ? 'Today' : days === '7' ? '7 days' : '30 days'}
              </button>
            ))}
          </div>
          
          {/* Action Type Filter and Search */}
          <div className="flex space-x-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <select 
                value={actionTypeFilter} 
                onChange={(e) => setActionTypeFilter(e.target.value)}
                className="pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 appearance-none cursor-pointer shadow-elegant"
              >
                <option value="all">All Actions</option>
                <option value="sent">Sent/Replied</option>
                <option value="rejected">Rejected</option>
                <option value="snoozed">Snoozed</option>
              </select>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search history..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 placeholder-gray-500 w-64 shadow-elegant"
              />
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="relative w-12 h-12 mx-auto mb-6">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-gray-700">Loading activity history...</p>
          <p className="text-sm text-gray-500 mt-2">Retrieving past actions</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-elegant">
          {filteredHistory.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredHistory.map(item => (
                <div 
                  key={item.id} 
                  className="group p-6 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                  onClick={() => setShowHistoryViewer(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors">
                        {getActionIcon(item.actionType)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                          {item.actionSummary}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <p className="text-sm text-gray-600">
                            {formatTimestamp(item.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-blue-600 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View details</span>
                        <ArrowRight size={12} className="ml-2" />
                      </div>
                      {item.undoable && ['EMAIL_SENT', 'EMAIL_EDITED'].includes(item.actionType) && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedHistoryItem(item); 
                          }} 
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center transition-colors cursor-pointer"
                        >
                          <RotateCcw size={12} className="mr-1.5" />
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-gray-50 rounded-2xl p-12 w-full">
                <Clock size={48} className="mx-auto text-gray-400 mb-6" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No History Found</h3>
                <p className="text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search term.' : 'No actions recorded in the selected time period.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Modals */}
      {showHistoryViewer && (
        <HistoryViewer 
          item={showHistoryViewer} 
          onClose={() => setShowHistoryViewer(null)} 
        />
      )}
    </div>
  );
}; 