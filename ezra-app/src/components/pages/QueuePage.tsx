'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Edit3, Mail, X, Send, Trash2, MessageSquare, CheckCircle2, ArrowRight } from 'lucide-react';
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-elegant-lg border border-gray-200 p-8 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Trash2 size={20} className="mr-3 text-red-500" />
              Reject Response
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <X size={24} />
            </button>
          </div>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Help improve our AI by providing feedback on why this response should be rejected.
          </p>
          <textarea
            value={rejectFeedback}
            onChange={(e) => setRejectFeedback(e.target.value)}
            placeholder="e.g., Too formal, missing context, inappropriate tone..."
            className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none text-gray-900 placeholder-gray-500 text-sm"
          />
          <div className="mt-6 flex justify-end space-x-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSubmit(rejectFeedback)}
              disabled={!rejectFeedback.trim()}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl flex items-center transition-colors shadow-elegant cursor-pointer disabled:cursor-not-allowed"
            >
              <Trash2 size={16} className="mr-2" />
              Reject Response
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Email Viewer Component
  const EmailViewer: React.FC<{ item: QueueItem; onClose: () => void; onAction: (id: string, action: string) => void }> = ({ item, onClose, onAction }) => {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-elegant-lg border border-gray-200 p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <MessageSquare size={20} className="mr-3 text-blue-600" />
              Email Review & AI Response
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <X size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Original Email */}
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-elegant">
                <h4 className="text-lg font-medium text-blue-700 mb-4 flex items-center">
                  <Mail size={18} className="mr-3" />
                  Incoming Email
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <span className="text-gray-500 w-16">From:</span>
                    <span className="text-gray-900">{item.metadata?.from}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-16">Subject:</span>
                    <span className="text-gray-900">{item.metadata?.subject}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-16">Time:</span>
                    <span className="text-gray-700">{item.metadata?.receivedAt ? new Date(item.metadata.receivedAt).toLocaleString() : 'Recently'}</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 max-h-64 overflow-y-auto shadow-elegant">
                  <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                    {item.metadata?.body || 'Email content not available'}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generated Response */}
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-elegant">
                <h4 className="text-lg font-medium text-emerald-700 mb-4 flex items-center">
                  <CheckCircle2 size={18} className="mr-3" />
                  AI Generated Reply
                </h4>
                <div className="mt-6 p-4 bg-white rounded-lg border border-emerald-200 max-h-64 overflow-y-auto shadow-elegant">
                  <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                    {item.fullDraft || item.draftPreview || 'No draft available'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Review both emails and choose your action
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => { onAction(item.id, 'reject'); onClose(); }}
                className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl flex items-center transition-colors cursor-pointer"
              >
                <Trash2 size={16} className="mr-2" />
                Reject
              </button>
              <button
                onClick={() => { onAction(item.id, 'edit'); onClose(); }}
                className="px-5 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center transition-colors cursor-pointer"
              >
                <Edit3 size={16} className="mr-2" />
                Edit
              </button>
              <button
                onClick={() => { onAction(item.id, 'approve'); onClose(); }}
                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center transition-colors shadow-elegant cursor-pointer"
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-elegant-lg border border-gray-200 p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Edit3 size={20} className="mr-3 text-blue-600" />
              Edit & Send Email
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <X size={24} />
            </button>
          </div>
          
          {/* Email Headers */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
              <input
                type="text"
                value={item.metadata?.from || ''}
                disabled
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900"
              />
            </div>
          </div>

          {/* Original Email Context */}
          <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl shadow-elegant">
            <h4 className="text-lg font-medium text-blue-700 mb-4 flex items-center">
              <Mail size={18} className="mr-3" />
              Original Email
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex">
                <span className="text-gray-500 w-20">From:</span>
                <span className="text-gray-900">{item.metadata?.from}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-20">Subject:</span>
                <span className="text-gray-900">{item.metadata?.subject}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-20">Time:</span>
                <span className="text-gray-700">{item.metadata?.receivedAt ? new Date(item.metadata.receivedAt).toLocaleString() : 'Recently'}</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 max-h-80 overflow-y-auto shadow-elegant">
              <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                {item.metadata?.body || 'Email content not available'}
              </div>
            </div>
          </div>

          {/* Email Content Editor */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">Your Reply:</label>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Write your email reply here..."
              className="w-full h-64 p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Draft generated by AI
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => onSend(emailContent)}
                disabled={!emailContent.trim()}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-xl flex items-center transition-colors shadow-elegant cursor-pointer disabled:cursor-not-allowed"
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
        className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-elegant-md transition-all duration-300 cursor-pointer shadow-elegant"
        onClick={() => setShowEmailViewer(item)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
              {item.actionSummary}
            </h3>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              {item.contextSummary}
            </p>
            <div className="flex items-center space-x-6 text-xs text-gray-500">
              <span className="flex items-center">
                <Mail size={12} className="mr-2" />
                {item.metadata?.from}
              </span>
              <span className="flex items-center">
                <Clock size={12} className="mr-2" />
                {item.metadata?.receivedAt ? new Date(item.metadata.receivedAt).toLocaleDateString() : 'Recently'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
              item.status === 'needs-attention' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
              item.status === 'auto-approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
              'bg-gray-100 text-gray-700 border border-gray-200'
            }`}>
              {item.status.replace('-', ' ')}
            </span>
          </div>
        </div>
        
        {item.draftPreview && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-elegant">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium text-gray-700">AI Generated Reply:</span>
              <span className="text-xs text-emerald-600">Ready to send</span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">
              {item.draftPreview}
            </p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-blue-600 font-medium flex items-center">
            <span>Click to review</span>
            <ArrowRight size={12} className="ml-2" />
          </div>
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onAction(item.id, 'approve')}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center transition-colors shadow-elegant cursor-pointer"
            >
              <ShieldCheck size={12} className="mr-1.5" />
              Approve
            </button>
            <button
              onClick={() => onAction(item.id, 'edit')}
              className="px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center transition-colors cursor-pointer"
            >
              <Edit3 size={12} className="mr-1.5" />
              Edit
            </button>
            <button
              onClick={() => onAction(item.id, 'reject')}
              className="px-4 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center transition-colors cursor-pointer"
            >
              <Trash2 size={12} className="mr-1.5" />
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-elegant">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="flex-1 mb-6 lg:mb-0">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Inbox Intelligence
            </h1>
            <p className="text-gray-600 max-w-2xl leading-relaxed">
              AI-powered email management dashboard. Review, approve, and manage your automated email responses.
            </p>
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 shadow-elegant">
            {(['all', 'needs-attention', 'auto-approved', 'snoozed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer
                  ${filter === f 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-elegant' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
              >
                {f.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Showing {filteredItems.length} {filteredItems.length === 1 ? 'email' : 'emails'}
        </span>
        <div className="flex space-x-6 items-center">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-600 text-xs">Auto-approved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-gray-600 text-xs">Needs review</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 text-xs">Snoozed</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-elegant">
          <span className="text-sm font-medium text-blue-800">
            {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'} selected
          </span>
          <div className="space-x-3">
            <button 
              onClick={() => handleBulkAction('approve')} 
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-elegant cursor-pointer"
            >
              Approve Selected
            </button>
            <button 
              onClick={() => handleBulkAction('reject')} 
              className="px-4 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
            >
              Reject Selected
            </button>
          </div>
        </div>
      )}

      {/* Email List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="relative w-12 h-12 mx-auto mb-6">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-gray-700">Loading your emails...</p>
          <p className="text-sm text-gray-500 mt-2">Analyzing incoming messages</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div key={item.id} className="flex items-start space-x-4">
              <input 
                type="checkbox" 
                className="mt-8 w-4 h-4 text-blue-500 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                checked={selectedItems.has(item.id)}
                onChange={() => toggleSelectItem(item.id)}
              />
              <div className="flex-1">
                <EmailQueueCard item={item} onAction={handleAction} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="bg-white border border-gray-200 rounded-2xl p-12 max-w-md mx-auto shadow-elegant">
            <Mail size={48} className="mx-auto text-gray-400 mb-6" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">All Clear</h3>
            <p className="text-sm text-gray-500">
              No emails in your queue. New messages will appear here automatically.
            </p>
          </div>
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
  );
};
