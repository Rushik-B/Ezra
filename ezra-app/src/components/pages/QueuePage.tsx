'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Clock, Edit3, Inbox, X } from 'lucide-react';
import { QueueItem } from '@/types';
import { ActionCard } from '@/components/ui/ActionCard';

interface QueuePageProps {
  queueItems: QueueItem[];
  setQueueItems: React.Dispatch<React.SetStateAction<QueueItem[]>>;
}

export const QueuePage: React.FC<QueuePageProps> = ({ queueItems, setQueueItems }) => {
  const [filter, setFilter] = useState<'all' | 'needs-attention' | 'auto-approved' | 'snoozed'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showLivePreview, setShowLivePreview] = useState<QueueItem | null>(null);

  const handleAction = (itemId: string, actionType: string) => {
    console.log(`Action: ${actionType} on item: ${itemId}`);
    
    if (actionType === 'approve') {
      setQueueItems(prev => prev.map(item => item.id === itemId ? {...item, status: 'auto-approved' as const} : item));
    } else if (actionType === 'reject') {
      setQueueItems(prev => prev.filter(item => item.id !== itemId));
    } else if (actionType === 'snooze') {
      setQueueItems(prev => prev.map(item => item.id === itemId ? {...item, status: 'snoozed' as const} : item));
    } else if (actionType === 'edit') {
       const itemToEdit = queueItems.find(item => item.id === itemId);
       if (itemToEdit) {
         setShowLivePreview(itemToEdit);
       }
    }
  };
  
  const handleBulkAction = (actionType: string) => {
    console.log(`Bulk Action: ${actionType} on items:`, Array.from(selectedItems));
    
    if (actionType === 'approve') {
       setQueueItems(prev => prev.map(item => selectedItems.has(item.id) ? {...item, status: 'auto-approved' as const} : item));
    } else if (actionType === 'reject') {
       setQueueItems(prev => prev.filter(item => !selectedItems.has(item.id)));
    }
    setSelectedItems(new Set());
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const filteredItems = queueItems.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const LivePreviewPanel: React.FC<{ item: QueueItem; onClose: () => void; onSave: (id: string, draft: string) => void }> = ({ item, onClose, onSave }) => {
    const [editedDraft, setEditedDraft] = useState(item.fullDraft);
    
    useEffect(() => setEditedDraft(item.fullDraft), [item]);

    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl transform transition-all duration-300 ease-out scale-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Edit Draft: {item.actionSummary}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              <X size={24} />
            </button>
          </div>
          <textarea
            value={editedDraft}
            onChange={(e) => setEditedDraft(e.target.value)}
            className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          />
          <div className="mt-6 flex justify-end space-x-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md shadow-sm"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onSave(item.id, editedDraft);
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-md shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">EZRA&apos;s Action Queue</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage tasks Ezra has prepared or needs your input on.</p>
        </div>
        <div className="flex items-center space-x-1 mt-3 sm:mt-0 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {(['all', 'needs-attention', 'auto-approved', 'snoozed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150
                ${filter === f 
                  ? 'bg-emerald-500 text-white shadow' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {f.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-b pb-2 mb-2 border-gray-200 dark:border-gray-700">
        <span>Showing {filteredItems.length} items</span>
        <div className="flex space-x-2 items-center">
          <span className="flex items-center"><ShieldCheck size={12} className="mr-1 text-emerald-500"/> Auto</span>
          <span className="flex items-center"><AlertTriangle size={12} className="mr-1 text-yellow-500"/> Needs Approval</span>
          <span className="flex items-center"><Clock size={12} className="mr-1 text-blue-500"/> Snoozed</span>
          <span className="flex items-center"><Edit3 size={12} className="mr-1 text-gray-500"/> Manual</span>
        </div>
      </div>

      {selectedItems.size > 0 && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg flex items-center justify-between mb-4 shadow">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{selectedItems.size} items selected</span>
          <div className="space-x-2">
            <button onClick={() => handleBulkAction('approve')} className="px-3 py-1 text-xs text-white bg-emerald-500 hover:bg-emerald-600 rounded">Approve Selected</button>
            <button onClick={() => handleBulkAction('reject')} className="px-3 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded">Reject Selected</button>
          </div>
        </div>
      )}

      {filteredItems.length > 0 ? (
        <div className="space-y-1">
          {filteredItems.map(item => (
            <div key={item.id} className="action-card-wrapper flex items-start space-x-2" data-id={item.id} tabIndex={0}>
              <input 
                type="checkbox" 
                className="mt-6 ml-1 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                checked={selectedItems.has(item.id)}
                onChange={() => toggleSelectItem(item.id)}
              />
              <div className="flex-grow">
                <ActionCard item={item} onAction={handleAction} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Inbox size={48} className="mx-auto text-gray-400 dark:text-gray-500" />
          <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-300">Queue is Empty</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ezra has handled everything for now, or there are no items matching your filter.</p>
        </div>
      )}
      
      {showLivePreview && (
        <LivePreviewPanel 
          item={showLivePreview} 
          onClose={() => setShowLivePreview(null)} 
          onSave={(id, draft) => {
            setQueueItems(prev => prev.map(i => i.id === id ? {...i, fullDraft: draft, draftPreview: draft.substring(0,100) + '...'} : i));
            setShowLivePreview(null);
          }} 
        />
      )}
    </div>
  );
}; 