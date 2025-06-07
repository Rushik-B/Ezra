'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Clock, Edit3, Mail, X, Send, Trash2, MessageSquare, CheckCircle2, ArrowRight } from 'lucide-react';
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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Trash2 size={20} className="mr-3 text-red-400" />
              Reject Response
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
          <p className="text-slate-300 mb-6 leading-relaxed">
            Help improve our AI by providing feedback on why this response should be rejected.
          </p>
          <textarea
            value={rejectFeedback}
            onChange={(e) => setRejectFeedback(e.target.value)}
            placeholder="e.g., Too formal, missing context, inappropriate tone..."
            className="w-full h-32 p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-red-400/50 focus:border-red-400/50 resize-none text-white placeholder-slate-400 text-sm"
          />
          <div className="mt-6 flex justify-end space-x-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSubmit(rejectFeedback)}
              disabled={!rejectFeedback.trim()}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 disabled:bg-red-500/30 rounded-xl flex items-center transition-colors"
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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <MessageSquare size={20} className="mr-3 text-blue-400" />
              Email Review & AI Response
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Original Email */}
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                <h4 className="text-lg font-medium text-blue-200 mb-4 flex items-center">
                  <Mail size={18} className="mr-3" />
                  Incoming Email
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <span className="text-slate-400 w-16">From:</span>
                    <span className="text-white">{item.metadata?.from}</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-400 w-16">Subject:</span>
                    <span className="text-white">{item.metadata?.subject}</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-400 w-16">Time:</span>
                    <span className="text-slate-300">{item.metadata?.receivedAt ? new Date(item.metadata.receivedAt).toLocaleString() : 'Recently'}</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-slate-950/50 rounded-lg border border-slate-700/30 max-h-64 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">
                    {item.metadata?.body || 'Email content not available'}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generated Response */}
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                <h4 className="text-lg font-medium text-emerald-200 mb-4 flex items-center">
                  <CheckCircle2 size={18} className="mr-3" />
                  AI Generated Reply
                </h4>
                <div className="mt-6 p-4 bg-slate-950/50 rounded-lg border border-slate-700/30 max-h-64 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">
                    {item.fullDraft || item.draftPreview || 'No draft available'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-slate-400">
              Review both emails and choose your action
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { onAction(item.id, 'reject'); onClose(); }}
                className="px-5 py-2.5 text-sm font-medium text-red-300 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl flex items-center transition-colors"
              >
                <Trash2 size={16} className="mr-2" />
                Reject
              </button>
              <button
                onClick={() => { onAction(item.id, 'edit'); onClose(); }}
                className="px-5 py-2.5 text-sm font-medium text-blue-300 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl flex items-center transition-colors"
              >
                <Edit3 size={16} className="mr-2" />
                Edit
              </button>
              <button
                onClick={() => { onAction(item.id, 'approve'); onClose(); }}
                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-500/80 hover:bg-emerald-500 rounded-xl flex items-center transition-colors"
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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Edit3 size={20} className="mr-3 text-blue-400" />
              Edit & Send Email
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
          
          {/* Email Headers */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">To:</label>
              <input
                type="text"
                value={item.metadata?.from || ''}
                disabled
                className="w-full p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white"
              />
            </div>
          </div>

          {/* Original Email Context */}
          <div className="mb-8 p-6 bg-slate-900/30 border border-slate-700/30 rounded-xl">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Original Email:</h4>
            <div className="text-sm text-slate-400 space-y-2">
              <p><span className="font-medium">From:</span> {item.metadata?.from}</p>
              <p><span className="font-medium">Subject:</span> {item.metadata?.subject}</p>
              <div className="mt-4 p-4 bg-slate-950/50 rounded-lg border border-slate-700/30 max-h-32 overflow-y-auto">
                <div className="text-xs text-slate-300">
                  {item.metadata?.body?.substring(0, 300)}{item.metadata?.body && item.metadata.body.length > 300 ? '...' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Email Content Editor */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-3">Your Reply:</label>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Write your email reply here..."
              className="w-full h-64 p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 resize-none text-white placeholder-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-400">
              Draft generated by AI
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => onSend(emailContent)}
                disabled={!emailContent.trim()}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500/80 hover:bg-blue-500 disabled:bg-blue-500/30 rounded-xl flex items-center transition-colors"
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
        className="group bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-6 hover:bg-slate-800/60 hover:border-slate-600/50 transition-all duration-300 cursor-pointer"
        onClick={() => setShowEmailViewer(item)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-medium text-white mb-2 group-hover:text-blue-200 transition-colors">
              {item.actionSummary}
            </h3>
            <p className="text-sm text-slate-400 mb-3 leading-relaxed">
              {item.contextSummary}
            </p>
            <div className="flex items-center space-x-6 text-xs text-slate-500">
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
              item.status === 'needs-attention' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
              item.status === 'auto-approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              'bg-slate-500/20 text-slate-300 border border-slate-500/30'
            }`}>
              {item.status.replace('-', ' ')}
            </span>
          </div>
        </div>
        
        {item.draftPreview && (
          <div className="mb-4 p-4 bg-slate-900/40 border border-slate-700/30 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium text-slate-300">AI Generated Reply:</span>
              <span className="text-xs text-emerald-400">Ready to send</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {item.draftPreview}
            </p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-blue-400 font-medium flex items-center">
            <span>Click to review</span>
            <ArrowRight size={12} className="ml-2" />
          </div>
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onAction(item.id, 'approve')}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-500/80 hover:bg-emerald-500 rounded-lg flex items-center transition-colors"
            >
              <ShieldCheck size={12} className="mr-1.5" />
              Approve
            </button>
            <button
              onClick={() => onAction(item.id, 'edit')}
              className="px-4 py-2 text-xs font-medium text-blue-300 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg flex items-center transition-colors"
            >
              <Edit3 size={12} className="mr-1.5" />
              Edit
            </button>
            <button
              onClick={() => onAction(item.id, 'reject')}
              className="px-4 py-2 text-xs font-medium text-red-300 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg flex items-center transition-colors"
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
    <div className="min-h-screen bg-slate-950">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div className="flex-1 mb-6 lg:mb-0">
              <h1 className="text-3xl font-semibold text-white mb-2">
                Inbox Intelligence
              </h1>
              <p className="text-slate-400 max-w-2xl leading-relaxed">
                AI-powered email management dashboard. Review, approve, and manage your automated email responses.
              </p>
            </div>
            
            <div className="flex items-center space-x-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50">
              {(['all', 'needs-attention', 'auto-approved', 'snoozed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 text-xs font-medium rounded-lg transition-all duration-200
                    ${filter === f 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
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
          <span className="text-slate-400">
            Showing {filteredItems.length} {filteredItems.length === 1 ? 'email' : 'emails'}
          </span>
          <div className="flex space-x-6 items-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-slate-400 text-xs">Auto-approved</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-slate-400 text-xs">Needs review</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-slate-400 text-xs">Snoozed</span>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-200">
              {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'} selected
            </span>
            <div className="space-x-3">
              <button 
                onClick={() => handleBulkAction('approve')} 
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-500/80 hover:bg-emerald-500 rounded-lg transition-colors"
              >
                Approve Selected
              </button>
              <button 
                onClick={() => handleBulkAction('reject')} 
                className="px-4 py-2 text-xs font-medium text-red-300 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors"
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
              <div className="w-12 h-12 border-2 border-slate-700 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-medium text-slate-300">Loading your emails...</p>
            <p className="text-sm text-slate-500 mt-2">Analyzing incoming messages</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map(item => (
              <div key={item.id} className="flex items-start space-x-4">
                <input 
                  type="checkbox" 
                  className="mt-8 w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
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
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-12 max-w-md mx-auto">
              <Mail size={48} className="mx-auto text-slate-500 mb-6" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">All Clear</h3>
              <p className="text-sm text-slate-500">
                No emails in your queue. New messages will appear here automatically.
              </p>
            </div>
          </div>
        )}
      </div>
      
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
