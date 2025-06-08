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
        return <ShieldCheck className="text-emerald-400" size={16} />;
      case 'EMAIL_EDITED':
        return <Edit3 className="text-blue-400" size={16} />;
      case 'EMAIL_REJECTED':
        return <Trash2 className="text-red-400" size={16} />;
      case 'EMAIL_SNOOZED':
        return <Clock className="text-yellow-400" size={16} />;
      case 'MASTER_PROMPT_UPDATED':
        return <Settings className="text-purple-400" size={16} />;
      default:
        return <AlertTriangle className="text-slate-400" size={16} />;
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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-semibold text-white flex items-center">
              {getActionIcon(item.actionType)}
              <span className="ml-3">Action Details - {item.actionType.replace('_', ' ')}</span>
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Original Email */}
            {actionDetails.emailFrom && (
              <div className="space-y-6">
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                  <h4 className="text-lg font-medium text-blue-200 mb-4 flex items-center">
                    <Mail size={18} className="mr-3" />
                    Original Email
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex">
                      <span className="text-slate-400 w-20">From:</span>
                      <span className="text-white">{actionDetails.emailFrom}</span>
                    </div>
                    <div className="flex">
                      <span className="text-slate-400 w-20">Subject:</span>
                      <span className="text-white">{actionDetails.emailSubject}</span>
                    </div>
                    <div className="flex">
                      <span className="text-slate-400 w-20">Action:</span>
                      <span className="text-slate-300">{item.actionSummary}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Response / Action Details */}
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                <h4 className="text-lg font-medium text-emerald-200 mb-4 flex items-center">
                  {getActionIcon(item.actionType)}
                  <span className="ml-3">Action Result</span>
                </h4>
                {actionDetails.finalContent && (
                  <div className="mt-6 p-4 bg-slate-950/50 rounded-lg border border-slate-700/30 max-h-64 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">
                      {actionDetails.finalContent}
                    </div>
                  </div>
                )}
                {actionDetails.rejectionReason && (
                  <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-300">
                      <strong>Rejection Reason:</strong> {actionDetails.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Details */}
          <div className="mt-8 bg-slate-900/30 border border-slate-700/30 rounded-xl p-6">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Full Action Context:</h4>
            <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap font-mono">
              {item.fullContext}
            </pre>
          </div>

          {/* Close Button */}
          <div className="mt-8 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-white bg-emerald-500/80 hover:bg-emerald-500 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-slate-900/50 border border-slate-700/60 rounded-lg p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div className="flex-1 mb-4 lg:mb-0">
              <h1 className="text-2xl font-semibold text-white mb-2">
                Activity History
              </h1>
              <p className="text-slate-300 max-w-2xl leading-relaxed text-sm">
                Track all AI actions and decisions. Review past performance and analyze patterns.
              </p>
            </div>
          
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Time Range Filter */}
              <div className="flex items-center space-x-2 bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-xl p-1.5">
                {['1', '7', '30'].map(days => (
                  <button
                    key={days}
                    onClick={() => setFilter(days)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      filter === days 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {days === '1' ? 'Today' : days === '7' ? '7 days' : '30 days'}
                  </button>
                ))}
              </div>
              
              {/* Action Type Filter and Search */}
              <div className="flex space-x-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select 
                    value={actionTypeFilter} 
                    onChange={(e) => setActionTypeFilter(e.target.value)}
                    className="pl-10 pr-4 py-2.5 text-sm bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white appearance-none cursor-pointer"
                  >
                    <option value="all">All Actions</option>
                    <option value="sent">Sent/Replied</option>
                    <option value="rejected">Rejected</option>
                    <option value="snoozed">Snoozed</option>
                  </select>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search history..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 text-sm bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white placeholder-slate-400 w-64"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="relative w-12 h-12 mx-auto mb-6">
              <div className="w-12 h-12 border-2 border-slate-700 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-medium text-slate-300">Loading activity history...</p>
            <p className="text-sm text-slate-500 mt-2">Retrieving past actions</p>
          </div>
        ) : (
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl overflow-hidden">
            {filteredHistory.length > 0 ? (
              <div className="divide-y divide-slate-700/50">
                {filteredHistory.map(item => (
                  <div 
                    key={item.id} 
                    className="group p-6 hover:bg-slate-700/30 transition-all duration-200 cursor-pointer"
                    onClick={() => setShowHistoryViewer(item)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-slate-700/50 rounded-xl group-hover:bg-slate-600/50 transition-colors">
                          {getActionIcon(item.actionType)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white group-hover:text-blue-200 transition-colors">
                            {item.actionSummary}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <p className="text-sm text-slate-400">
                              {formatTimestamp(item.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-sm text-blue-400 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>View details</span>
                          <ArrowRight size={12} className="ml-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-slate-900/50 rounded-2xl p-12 max-w-md mx-auto">
                  <Clock size={48} className="mx-auto text-slate-500 mb-6" />
                  <h3 className="text-lg font-medium text-slate-300 mb-2">No History Found</h3>
                  <p className="text-sm text-slate-500">
                    {searchTerm ? 'Try adjusting your search term.' : 'No actions recorded in the selected time period.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
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