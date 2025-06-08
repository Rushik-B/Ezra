'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Wand2, Brain, Sparkles, Eye, Play, Save, History, Bot, Zap, TestTube, RotateCw, Info } from 'lucide-react';

interface MasterPrompt {
  id: string;
  prompt: string;
  version: number;
  isActive: boolean;
  isGenerated?: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface TestResult {
  testEmail: {
    from: string;
    to: string[];
    subject: string;
    body: string;
    date: string;
  };
  masterPrompt: {
    version: number;
    isDefault: boolean;
    prompt: string;
  };
  historicalEmailsCount: number;
  generatedReply: {
    reply: string;
    confidence: number;
    reasoning: string;
  };
  timestamp: string;
  isCustomEmail: boolean;
}

interface CustomEmailForm {
  from: string;
  subject: string;
  body: string;
}

export const VoiceRulesPage: React.FC = () => {
  const { data: session } = useSession();
  const [currentPrompt, setCurrentPrompt] = useState<MasterPrompt | null>(null);
  const [promptHistory, setPromptHistory] = useState<MasterPrompt[]>([]);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  
  // Test reply generation state
  const [isTestingReply, setIsTestingReply] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  
  // Custom email form state
  const [customEmail, setCustomEmail] = useState<CustomEmailForm>({
    from: 'sara@starboard.ai',
    subject: 'Deployment update',
    body: 'Hi all,\n\nQuick update - the maintenance window with Globex went smoothly.\n\nAlex\'s team completed the deployment at 12:28 AM PST. Validation steps were finalized shortly after, and we received confirmation from the Globex EU team that data integrity checks are passing on their end. No anomalies reported post-push.\n\nThanks everyone for the coordination and late-night support.\n\nBest,\nSara'
  });

  const [currentPromptInfo, setCurrentPromptInfo] = useState<{
    version: number;
    isDefault: boolean;
    id?: string;
  }>({ version: 0, isDefault: true });
  const [generationEligibility, setGenerationEligibility] = useState<{
    canGenerate: boolean;
    emailCount: number;
    minimumRequired: number;
    message?: string;
  } | null>(null);

  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (session) {
      fetchCurrentPrompt();
      fetchPromptHistory();
      checkGenerationEligibility();
    }
  }, [session]);

  const fetchCurrentPrompt = async () => {
    try {
      const response = await fetch('/api/master-prompt');
      if (response.ok) {
        const data = await response.json();
        setCurrentPrompt(data);
        setEditedPrompt(data.prompt);
        setIsDefault(data.isDefault || false);
        setCurrentPromptInfo({
          version: data.version,
          isDefault: data.isDefault || false,
          id: data.id
        });
      }
    } catch (_err) {
      setError('Failed to fetch current prompt');
    }
  };

  const fetchPromptHistory = async () => {
    try {
      const response = await fetch('/api/master-prompt/history');
      if (response.ok) {
        const data = await response.json();
        setPromptHistory(data.prompts || []);
      }
    } catch (_err) {
      console.error('Failed to fetch prompt history:', _err);
    } finally {
      setIsLoading(false);
    }
  };

  const savePrompt = async () => {
    if (!editedPrompt.trim()) {
      setError('Prompt cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let response;
      
      // Check if this is an AI-generated prompt being edited (distilled edit)
      if (currentPrompt?.isGenerated && currentPrompt?.id) {
        console.log('🌀 Saving distilled prompt edits...');
        response = await fetch('/api/master-prompt', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: editedPrompt.trim(),
            promptId: currentPrompt.id,
            isDistilledEdit: true
          })
        });
      } else {
        // Create new manual prompt
        console.log('📝 Saving new manual prompt...');
        response = await fetch('/api/master-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: editedPrompt.trim()
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Prompt saved:', data);
        
        // Refresh both current prompt and history
        await fetchCurrentPrompt();
        await fetchPromptHistory();
        setIsDefault(false);
        
        // Show success message for distilled edits
        if (data.isDistilledUpdate) {
          console.log(`🎉 Distilled prompt edits applied to full Master Prompt v${data.version}`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save prompt');
      }
    } catch (err) {
      setError('Failed to save prompt');
      console.error('Error saving prompt:', err);
    } finally {
      setSaving(false);
    }
  };

  const activateVersion = async (promptId: string) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/master-prompt/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId
        })
      });

      if (response.ok) {
        // Refresh both current prompt and history
        await fetchCurrentPrompt();
        await fetchPromptHistory();
        
        // Update the edited prompt to match the activated version
        const activatedPrompt = promptHistory.find(p => p.id === promptId);
        if (activatedPrompt) {
          setEditedPrompt(activatedPrompt.prompt);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to activate version');
      }
    } catch (_err) {
      setError('Failed to activate version');
    } finally {
      setSaving(false);
    }
  };

  const testReplyGeneration = async () => {
    setIsTestingReply(true);
    setTestError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-reply-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customEmail: {
            from: customEmail.from.trim(),
            subject: customEmail.subject.trim(),
            body: customEmail.body.trim()
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(data);
      } else {
        const errorData = await response.json();
        setTestError(errorData.error || 'Failed to test reply generation');
      }
    } catch (_err) {
      setTestError('Failed to test reply generation');
    } finally {
      setIsTestingReply(false);
    }
  };

  const loadSampleEmails = () => {
    const samples = [
      {
        from: 'boss@company.com',
        subject: 'Urgent: Project Status Update',
        body: 'Hi there,\n\nI hope you\'re doing well. I need an update on the current project status by end of day. Can you please send me:\n\n1. Current progress percentage\n2. Any blockers or issues\n3. Expected completion date\n\nThis is needed for the board meeting tomorrow.\n\nThanks!'
      },
      {
        from: 'client@bigcorp.com',
        subject: 'Meeting Reschedule Request',
        body: 'Hello,\n\nI need to reschedule our meeting planned for Thursday 2pm due to a conflict that just came up. \n\nCould we move it to Friday same time? Let me know if that works for you.\n\nBest regards,\nSarah'
      },
      {
        from: 'team@startup.io',
        subject: 'Quick Question about Feature',
        body: 'Hey!\n\nQuick question - do you think we should add the dark mode toggle to the header or settings page? \n\nI\'m leaning towards header for better UX but wanted your thoughts.\n\nThanks!\nAlex'
      }
    ];
    
    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    setCustomEmail(randomSample);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const checkGenerationEligibility = async () => {
    try {
      const response = await fetch('/api/master-prompt/generate');
      if (response.ok) {
        const data = await response.json();
        setGenerationEligibility(data);
      }
    } catch (error) {
      console.error('Error checking generation eligibility:', error);
    }
  };

  const generateMasterPrompt = async () => {
    if (!generationEligibility?.canGenerate) {
      alert('You need more sent emails to generate a Master Prompt');
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const response = await fetch('/api/master-prompt/generate', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Master Prompt v${data.version} generated successfully with ${data.confidence}% confidence!`);
        await fetchCurrentPrompt();
        await fetchPromptHistory();
      } else {
        alert(`Failed to generate Master Prompt: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error('Error generating Master Prompt:', error);
      alert('Failed to generate Master Prompt. Please try again.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6 bg-gray-50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-gray-700">Loading AI Brain...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Voice & Rules</h1>
              <p className="text-gray-600 mt-1">Teach your AI assistant how to sound and behave like you.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 h-full flex flex-col">
              <div className="p-5 border-b border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wand2 className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Master Prompt
                  </h3>
                  {currentPrompt?.isGenerated && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      AI Generated
                    </span>
                  )}
                  {isDefault && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setShowHistory(!showHistory)} className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1.5">
                    <History size={14} />
                    <span>Version History</span>
                  </button>
                </div>
              </div>
              
              {currentPrompt?.isGenerated && (
                <div className="p-4 bg-blue-50 border-y border-blue-200/80">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-800">
                      You're editing a simplified version of an AI-generated prompt. Your changes will be intelligently applied to the full prompt.
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  placeholder="Define your AI's personality, tone, and rules here..."
                  className="flex-1 w-full p-4 bg-gray-50/50 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-mono text-sm leading-relaxed"
                />
                
                {error && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {editedPrompt.length} characters
                  </div>
                  <button
                    onClick={savePrompt}
                    disabled={isSaving || !editedPrompt.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center font-medium shadow-sm hover:shadow-md"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving...' : 'Save & Activate'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-5">
              <div className="flex items-center gap-3 mb-4">
                <TestTube className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Test Environment
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">From</label>
                  <input type="email" value={customEmail.from} onChange={(e) => setCustomEmail({ ...customEmail, from: e.target.value })} className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Subject</label>
                  <input type="text" value={customEmail.subject} onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })} className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Body</label>
                  <textarea value={customEmail.body} onChange={(e) => setCustomEmail({ ...customEmail, body: e.target.value })} rows={5} className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm resize-none" />
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <button onClick={loadSampleEmails} className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  Load Sample
                </button>
                <button onClick={testReplyGeneration} disabled={isTestingReply || !customEmail.from.trim()} className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <Play size={14} />
                  {isTestingReply ? 'Testing...' : 'Run Test'}
                </button>
              </div>

              {testError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{testError}</p>
                </div>
              )}

              {testResult && (
                <div className="mt-4 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800">Test Result:</h4>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="text-xs font-bold text-green-800 mb-2 flex items-center gap-2 uppercase tracking-wider">
                      <Zap size={14} /> AI Reply
                    </h5>
                    <p className="text-sm text-green-900 leading-relaxed font-mono">{testResult.generatedReply.reply}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Configuration Tips
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                <li>Be specific about the desired tone and style.</li>
                <li>Provide clear examples of how to respond.</li>
                <li>Use the test environment to try various scenarios.</li>
                <li>Regularly review and refine your master prompt.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 