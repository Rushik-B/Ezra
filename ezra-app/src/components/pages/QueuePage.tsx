'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Edit3, 
  Mail, 
  MoreHorizontal, 
  Send, 
  Trash2, 
  X, 
  Bot,
  Sparkles,
  Filter,
  Search,
  Archive,
  Star,
  AlertCircle,
  ChevronRight,
  Eye,
  Calendar
} from 'lucide-react';
import { QueueItem } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const QueuePage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'needs-attention' | 'auto-approved' | 'snoozed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
        setQueueItems(prev => prev.filter(queueItem => queueItem.id !== itemId));
        setShowEmailEditor(null);
      }
    } catch (error) {
      console.error('Error sending edited email:', error);
    }
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
    .filter(item => filter === 'all' || item.status === filter)
    .filter(item => 
      searchQuery === '' || 
      item.actionSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.metadata?.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.metadata?.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'needs-attention':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Needs Review</Badge>;
      case 'auto-approved':
        return <Badge variant="default" className="gap-1 bg-green-100 text-green-800 border-green-200 hover:bg-green-100"><CheckCircle className="h-3 w-3" />Auto-approved</Badge>;
      case 'snoozed':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Snoozed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (email: string) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  // Email Queue Card Component
  const EmailQueueCard: React.FC<{ item: QueueItem }> = ({ item }) => {
    return (
      <Card className="group bg-white hover:shadow-lg transition-shadow duration-300 rounded-xl border border-gray-200/80" onClick={() => setShowEmailViewer(item)}>
        <CardContent className="p-5 cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="flex items-center space-x-3 pt-1">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelectItem(item.id);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 shadow-sm"
                />
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback className="text-sm font-semibold bg-gray-100 text-gray-600">
                    {getInitials(item.metadata?.from || '')}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-800 line-clamp-1">
                        {item.actionSummary}
                      </h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                      {item.contextSummary}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {item.metadata?.from}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {item.metadata?.receivedAt ? new Date(item.metadata.receivedAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>

                {item.draftPreview && (
                  <Card className="bg-gray-50/70 border-gray-200/80 shadow-sm rounded-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                          AI-Generated Reply
                        </span>
                        <Badge variant="outline" className="text-xs bg-white text-gray-700">Ready</Badge>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                        {item.draftPreview}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center justify-end pt-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(item.id, 'approve');
                      }}
                      className="bg-green-600 hover:bg-green-700 shadow-sm text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(item.id, 'edit');
                      }}
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      <Edit3 className="h-4 w-4 mr-1.5" />
                      Edit & Send
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-gray-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleAction(item.id, 'reject');
                        }}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" />
                          Priority
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Email Viewer Dialog
  const EmailViewer: React.FC<{ item: QueueItem; onClose: () => void }> = ({ item, onClose }) => {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] flex flex-col bg-gray-50 shadow-2xl rounded-lg">
          <DialogHeader className="p-6 border-b border-gray-200">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
              <Mail className="h-6 w-6 text-blue-600" />
              Email Review & AI Response
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 flex-1 overflow-auto">
            {/* Original Email */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-base font-semibold flex items-center gap-2 text-gray-800">
                  <Mail className="h-5 w-5" />
                  Incoming Email
                </h3>
              </div>
              <div className="p-6 flex-1 space-y-4">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <span className="text-gray-500 font-medium">From:</span>
                  <span className="font-semibold text-gray-800">{item.metadata?.from}</span>
                  <span className="text-gray-500 font-medium">Subject:</span>
                  <span className="font-semibold text-gray-800">{item.metadata?.subject}</span>
                </div>
                <Separator />
                <div className="bg-gray-50/50 rounded-lg p-4 h-full overflow-y-auto border border-gray-200">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {item.metadata?.body || 'Email content not available'}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generated Response */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-blue-50/50">
                <h3 className="text-base font-semibold flex items-center gap-2 text-blue-800">
                  <Sparkles className="h-5 w-5" />
                  AI Generated Reply
                </h3>
              </div>
              <div className="p-6 flex-1">
                <div className="bg-gray-50/50 rounded-lg p-4 h-full overflow-y-auto border border-gray-200">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {item.fullDraft || item.draftPreview || 'No draft available'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => { handleAction(item.id, 'reject'); onClose(); }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              variant="outline"
              onClick={() => { handleAction(item.id, 'edit'); onClose(); }}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => { handleAction(item.id, 'approve'); onClose(); }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Reject Dialog
  const RejectDialog: React.FC<{ itemId: string; onClose: () => void }> = ({ onClose }) => {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white shadow-xl rounded-lg">
          <DialogHeader className="p-6 border-b border-gray-200">
            <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <Trash2 className="h-5 w-5 text-red-500" />
              Reject AI Response
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Your feedback helps our AI improve. Why are you rejecting this response?
            </p>
            <Textarea
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              placeholder="e.g., Tone was off, missed key details..."
              className="min-h-[120px] focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleReject(showRejectDialog!, rejectFeedback)}
              disabled={!rejectFeedback.trim()}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Email Editor Dialog
  const EmailEditor: React.FC<{ item: QueueItem; onClose: () => void }> = ({ item, onClose }) => {
    const [emailContent, setEmailContent] = useState(item.fullDraft || '');
    const [subject, setSubject] = useState(`Re: ${item.metadata?.subject || ''}`);
    
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] flex flex-col bg-gray-50 shadow-2xl rounded-lg">
          <DialogHeader className="p-6 border-b border-gray-200">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
              <Edit3 className="h-6 w-6 text-blue-600" />
              Edit & Send Email
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 flex-1 overflow-auto">
            {/* Original Email */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-800">Original Message</h3>
              </div>
              <div className="p-6 flex-1 space-y-4">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <span className="text-gray-500 font-medium">From:</span>
                  <span className="font-semibold text-gray-800">{item.metadata?.from}</span>
                  <span className="text-gray-500 font-medium">Subject:</span>
                  <span className="font-semibold text-gray-800">{item.metadata?.subject}</span>
                </div>
                <Separator />
                <div className="bg-gray-50/50 rounded-lg p-4 h-full overflow-y-auto border border-gray-200">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {item.metadata?.body || 'Email content not available'}
                  </div>
                </div>
              </div>
            </div>

            {/* Reply Editor */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-blue-50/50">
                <h3 className="text-base font-semibold text-blue-800">Your Reply</h3>
              </div>
              <div className="p-6 flex-1 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">To</label>
                  <Input
                    value={item.metadata?.from || ''}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Message</label>
                  <Textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="Write your email reply here..."
                    className="h-full resize-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-gray-100 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleSendEditedEmail(item.id, emailContent)}
              disabled={!emailContent.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80">
          <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-600 mt-1">Review and manage AI-generated email replies.</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-80 bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter('all')}>All Emails</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('needs-attention')}>Needs Review</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('auto-approved')}>Auto-approved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('snoozed')}>Snoozed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {(['all', 'needs-attention', 'auto-approved', 'snoozed'] as const).map(f => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className={`hidden sm:inline-flex ${
                  filter === f 
                    ? 'bg-gray-800 text-white hover:bg-gray-900' 
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                {f.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white shadow-sm border-gray-200/80">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-800">{queueItems.length}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Mail className="h-6 w-6 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-gray-200/80">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Needs Review</p>
                  <p className="text-2xl font-bold text-red-600">
                    {queueItems.filter(item => item.status === 'needs-attention').length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-gray-200/80">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Auto-approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {queueItems.filter(item => item.status === 'auto-approved').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-gray-200/80">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Filtered</p>
                  <p className="text-2xl font-bold text-gray-800">{filteredItems.length}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Filter className="h-6 w-6 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <Card className="bg-blue-50 border-blue-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-800">
                  {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'} selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve All
                  </Button>
                  <Button size="sm" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reject All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white shadow-sm border-gray-200/80">
                <CardContent className="p-5">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map(item => (
              <EmailQueueCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Card className="bg-white shadow-sm border-gray-200/80">
            <CardContent className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-6">
                <Mail className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">All Caught Up</h3>
              <p className="text-gray-500">
                Your inbox is empty. New items will appear here.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Dialog Modals */}
        {showRejectDialog && (
          <RejectDialog 
            itemId={showRejectDialog}
            onClose={() => setShowRejectDialog(null)} 
          />
        )}
        
        {showEmailViewer && (
          <EmailViewer 
            item={showEmailViewer}
            onClose={() => setShowEmailViewer(null)} 
          />
        )}

        {showEmailEditor && (
          <EmailEditor 
            item={showEmailEditor}
            onClose={() => setShowEmailEditor(null)} 
          />
        )}
      </div>
    </div>
  );
};
