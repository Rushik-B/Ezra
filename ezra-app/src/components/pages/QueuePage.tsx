'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Clock, Edit3, Inbox, X, Send, Trash2, MessageSquare } from 'lucide-react';
import { QueueItem } from '@/types';

export const QueuePage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'needs-attention' | 'auto-approved' | 'snoozed'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [showEmailEditor, setShowEmailEditor] = useState<QueueItem | null>(null);
  const [showEmailViewer, setShowEmailViewer] = useState<QueueItem | null>(null);

  // Fetch queue items on component mount
  useEffect(() => {
    fetchQueueItems();
  }, []);

  const fetchQueueItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/queue');
      const data = await response.json();
      
      if (data.success) {
        setQueueItems(data.queueItems || []);
      } else {
        console.error('Failed to fetch queue items:', data.error);
        setQueueItems([]);
      }
    } catch (error) {
      console.error('Error fetching queue items:', error);
      setQueueItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (itemId: string, actionType: string) => {
    console.log(`Action: ${actionType} on item: ${itemId}`);
    
    if (actionType === 'approve') {
      await handleApprove(itemId);
    } else if (actionType === 'reject') {
      setShowRejectDialog(itemId);
    } else if (actionType === 'edit') {
      const item = queueItems.find(q => q.id === itemId);
      if (item) {
        setShowEmailEditor(item);
      }
    }
  };

  const handleApprove = async (itemId: string) => {
    try {
      const item = queueItems.find(q => q.id === itemId);
      if (!item?.metadata?.emailId) return;

      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'approve', 
          emailId: item.metadata.emailId 
        })
      });

      if (response.ok) {
        // Remove item from queue as it's been actioned
        setQueueItems(prev => prev.filter(queueItem => queueItem.id !== itemId));
      }
    } catch (error) {
      console.error('Error approving item:', error);
    }
  };

  const handleReject = async (itemId: string, feedback: string) => {
    try {
      const item = queueItems.find(q => q.id === itemId);
      if (!item?.metadata?.emailId) return;

      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject', 
          emailId: item.metadata.emailId,
          feedback 
        })
      });

      if (response.ok) {
        setQueueItems(prev => prev.filter(queueItem => queueItem.id !== itemId));
        setShowRejectDialog(null);
        setRejectFeedback('');
      }
    } catch (error) {
      console.error('Error rejecting item:', error);
    }
  };

  const handleSendEditedEmail = async (itemId: string, draftContent: string) => {
    try {
      const item = queueItems.find(q => q.id === itemId);
      if (!item?.metadata?.emailId) return;

      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'edit', 
          emailId: item.metadata.emailId,
          draftContent 
        })
      });

      if (response.ok) {
        // Remove item from queue
        setQueueItems(prev => prev.filter(queueItem => queueItem.id !== itemId));
        setShowEmailEditor(null);
      }
    } catch (error) {
      console.error('Error sending edited email:', error);
    }
  };
  
  const handleBulkAction = (actionType: string) => {
    console.log(`Bulk Action: ${actionType} on items:`, Array.from(selectedItems));
    
    selectedItems.forEach(itemId => {
      if (actionType === 'approve') {
        handleApprove(itemId);
      } else if (actionType === 'reject') {
        // For bulk reject, we can't collect individual feedback, so we just reject them.
        handleReject(itemId, 'Bulk rejection.');
      }
    });
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

  // Apply filters
  const filteredItems = queueItems
    .filter(item => filter === 'all' || item.status === filter);

  // Reject Dialog Component
  const RejectDialog: React.FC<{ itemId: string; onClose: () => void; onSubmit: (feedback: string) => void }> = ({ onClose, onSubmit }) => {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
              <Trash2 size={20} className="mr-2 text-red-500" />
              Reject Reply
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              <X size={24} />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please provide feedback on why this reply should be rejected. This helps improve future responses.
          </p>
          <textarea
            value={rejectFeedback}
            onChange={(e) => setRejectFeedback(e.target.value)}
            placeholder="e.g., Too formal, missing key information, inappropriate tone..."
            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          />
          <div className="mt-6 flex justify-end space-x-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSubmit(rejectFeedback)}
              disabled={!rejectFeedback.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-md flex items-center"
            >
              <Trash2 size={16} className="mr-2" />
              Reject Reply
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Email Viewer Component
  const EmailViewer: React.FC<{ item: QueueItem; onClose: () => void; onAction: (id: string, action: string) => void }> = ({ item, onClose, onAction }) => {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
              <MessageSquare size={20} className="mr-2 text-blue-500" />
              Email Review & AI Response
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              <X size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Email */}
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                  <Inbox size={18} className="mr-2" />
                  Received Email
                </h4>
                <div className="space-y-2 text-sm">
                  <div><strong>From:</strong> {item.metadata?.from}</div>
                  <div><strong>Subject:</strong> {item.metadata?.subject}</div>
                  <div><strong>Received:</strong> {item.metadata?.receivedAt ? new Date(item.metadata.receivedAt).toLocaleString() : 'Recently'}</div>
                </div>
                <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border max-h-64 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                    {item.metadata?.body || 'Email content not available'}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generated Response */}
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                <h4 className="text-lg font-medium text-emerald-800 dark:text-emerald-200 mb-3 flex items-center">
                  <ShieldCheck size={18} className="mr-2" />
                  AI Generated Reply
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    (item.confidence || 0) >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    (item.confidence || 0) >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {item.confidence}% confidence
                  </span>
                </h4>
                <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border max-h-64 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                    {item.fullDraft || item.draftPreview || 'No draft available'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Review both emails above and choose your action
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Close
              </button>
              <button
                onClick={() => { onAction(item.id, 'reject'); onClose(); }}
                className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 rounded-md flex items-center"
              >
                <Trash2 size={16} className="mr-2" />
                Reject
              </button>
              <button
                onClick={() => { onAction(item.id, 'edit'); onClose(); }}
                className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-md flex items-center"
              >
                <Edit3 size={16} className="mr-2" />
                Edit
              </button>
              <button
                onClick={() => { onAction(item.id, 'approve'); onClose(); }}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-md flex items-center"
              >
                <ShieldCheck size={16} className="mr-2" />
                Approve & Send
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Email Editor Component
  const EmailEditor: React.FC<{ item: QueueItem; onClose: () => void; onSend: (content: string) => void }> = ({ item, onClose, onSend }) => {
    const [emailContent, setEmailContent] = useState(item.fullDraft || '');
    const [subject, setSubject] = useState(`Re: ${item.metadata?.subject || ''}`);
    
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
              <Edit3 size={20} className="mr-2 text-blue-500" />
              Edit & Send Email
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              <X size={24} />
            </button>
          </div>
          
          {/* Email Headers */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To:</label>
              <input
                type="text"
                value={item.metadata?.from || ''}
                disabled
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Original Email Context */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Original Email:</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>From:</strong> {item.metadata?.from}</p>
              <p><strong>Subject:</strong> {item.metadata?.subject}</p>
              <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border max-h-32 overflow-y-auto">
                {item.metadata?.body?.substring(0, 300)}{item.metadata?.body && item.metadata.body.length > 300 ? '...' : ''}
              </div>
            </div>
          </div>

          {/* Email Content Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Reply:</label>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Write your email reply here..."
              className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Confidence: {item.confidence || 85}% • Draft generated by AI
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={() => onSend(emailContent)}
                disabled={!emailContent.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-md flex items-center"
              >
                <Send size={16} className="mr-2" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Email Queue Card Component
  const EmailQueueCard: React.FC<{ item: QueueItem; onAction: (id: string, action: string) => void }> = ({ item, onAction }) => {
    
    return (
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
        onClick={() => setShowEmailViewer(item)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              {item.actionSummary}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {item.contextSummary}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <MessageSquare size={12} className="mr-1" />
                From: {item.metadata?.from}
              </span>
              <span className="flex items-center">
                <Clock size={12} className="mr-1" />
                {item.metadata?.receivedAt ? new Date(item.metadata.receivedAt).toLocaleDateString() : 'Recently'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${
              item.status === 'needs-attention' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
              item.status === 'auto-approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {item.status.replace('-', ' ')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.confidence}% confidence
            </span>
          </div>
        </div>
        
        {item.draftPreview && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Generated Reply:</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Ready to send</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {item.draftPreview}
            </p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Click to review email and AI response →
          </div>
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onAction(item.id, 'approve')}
              className="px-3 py-1 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded flex items-center"
            >
              <ShieldCheck size={12} className="mr-1" />
              Approve & Send
            </button>
            <button
              onClick={() => onAction(item.id, 'edit')}
              className="px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded flex items-center"
            >
              <Edit3 size={12} className="mr-1" />
              Edit
            </button>
            <button
              onClick={() => onAction(item.id, 'reject')}
              className="px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 rounded flex items-center"
            >
              <Trash2 size={12} className="mr-1" />
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex-1">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              EZRA&apos;s Action Queue
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI-powered email management • Intelligent replies • Automated workflows
            </p>
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

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-300">Loading queue items...</p>
        </div>
      ) : filteredItems.length > 0 ? (
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
                <EmailQueueCard item={item} onAction={handleAction} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Inbox size={48} className="mx-auto text-gray-400 dark:text-gray-500" />
          <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-300">No Emails Found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">No unprocessed emails in your queue. New emails will appear here automatically.</p>
        </div>
      )}
      
      {/* Dialog Modals */}
      {showRejectDialog && (
        <RejectDialog 
          itemId={showRejectDialog}
          onClose={() => setShowRejectDialog(null)} 
          onSubmit={(feedback) => handleReject(showRejectDialog, feedback)}
        />
      )}
      
      {showEmailViewer && (
        <EmailViewer 
          item={showEmailViewer}
          onClose={() => setShowEmailViewer(null)} 
          onAction={handleAction}
        />
      )}

      {showEmailEditor && (
        <EmailEditor 
          item={showEmailEditor}
          onClose={() => setShowEmailEditor(null)} 
          onSend={(content) => handleSendEditedEmail(showEmailEditor.id, content)}
        />
      )}
      </div>
    </div>
  );
};
