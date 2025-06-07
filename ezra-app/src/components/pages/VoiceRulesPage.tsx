'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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
    body: 'Hi all,\n\nQuick update — the maintenance window with Globex went smoothly.\n\nAlex’s team completed the deployment at 12:28 AM PST. Validation steps were finalized shortly after, and we received confirmation from the Globex EU team that data integrity checks are passing on their end. No anomalies reported post-push.\n\nThanks everyone for the coordination and late-night support.\n\nBest,\nSara'


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
  const [showTestModal, setShowTestModal] = useState(false);
  const [useCustomEmail, setUseCustomEmail] = useState(false);

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
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Master Prompt</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Master Prompt</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompt Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                Current Master Prompt {isDefault && <span className="text-sm text-gray-500">(Default)</span>}
                {currentPrompt?.isGenerated && (
                  <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                    (AI-Generated)
                  </span>
                )}
              </h3>
              <div className="flex items-center space-x-2">
                {currentPrompt && !isDefault && (
                  <span className="text-sm text-gray-500">
                    v{currentPrompt.version}
                  </span>
                )}
                {currentPrompt?.isGenerated && currentPrompt?.metadata?.confidence && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                    {currentPrompt.metadata.confidence}% confidence
                  </span>
                )}
              </div>
            </div>
            
            {currentPrompt?.isGenerated && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <div className="font-medium mb-1">📚 AI-Generated Master Prompt</div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">
                    This prompt was automatically generated by analyzing your email history. 
                    You're viewing a simplified version - your edits will be intelligently applied to the full prompt.
                    {currentPrompt.metadata?.emailsAnalyzed && (
                      <span className="block mt-1">
                        Based on {currentPrompt.metadata.emailsAnalyzed} sent emails.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              placeholder="Enter your master prompt here..."
              className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            />
            
            {error && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {editedPrompt.length} characters
                {currentPrompt?.isGenerated && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    • Editing distilled version
                  </span>
                )}
              </span>
              <button
                onClick={savePrompt}
                disabled={isSaving || !editedPrompt.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : currentPrompt?.isGenerated ? 'Apply Edits' : 'Save New Version'}
              </button>
            </div>
          </div>

          {/* Test Reply Generation Section */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                🧪 Test Reply Generation
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={loadSampleEmails}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Load Sample
                </button>
                <button
                  onClick={testReplyGeneration}
                  disabled={isTestingReply || !customEmail.from.trim() || !customEmail.subject.trim() || !customEmail.body.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTestingReply ? 'Testing...' : 'Generate Reply'}
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create a custom email to test your master prompt. Fill in the details below and see how your AI responds.
            </p>

            {/* Custom Email Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From (Sender Email)
                </label>
                <input
                  type="email"
                  value={customEmail.from}
                  onChange={(e) => setCustomEmail({ ...customEmail, from: e.target.value })}
                  placeholder="boss@company.com"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={customEmail.subject}
                  onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                  placeholder="Project Status Update"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Body
                </label>
                <textarea
                  value={customEmail.body}
                  onChange={(e) => setCustomEmail({ ...customEmail, body: e.target.value })}
                  placeholder="Enter the email content here..."
                  rows={6}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm resize-none"
                />
              </div>
            </div>

            {testError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-sm text-red-600 dark:text-red-400">
                  {testError}
                </div>
              </div>
            )}

            {testResult && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    📧 Test Email
                  </h4>
                  <div className="text-xs space-y-1 font-mono">
                    <div><span className="font-medium">From:</span> {testResult.testEmail.from}</div>
                    <div><span className="font-medium">Subject:</span> {testResult.testEmail.subject}</div>
                    <div className="mt-2">
                      <div className="font-medium mb-1">Body:</div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border text-xs whitespace-pre-wrap">
                        {testResult.testEmail.body}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    🤖 Generated Reply (Confidence: {testResult.generatedReply.confidence}%)
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap border border-blue-200 dark:border-blue-700 rounded p-3 bg-white dark:bg-blue-900/50 font-mono">
                    {testResult.generatedReply.reply}
                  </div>
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    <span className="font-medium">Reasoning:</span> {testResult.generatedReply.reasoning}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div>Master Prompt v{testResult.masterPrompt.version} • {testResult.historicalEmailsCount} historical emails from this sender</div>
                  <div>{formatDate(testResult.timestamp)}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prompt History */}
        <div className="space-y-4">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Version History
            </h3>
            
            {promptHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  No custom prompts yet
                </div>
                <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  Create your first custom prompt above
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {promptHistory.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      prompt.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => !prompt.isActive && activateVersion(prompt.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-gray-800 dark:text-white">
                        Version {prompt.version}
                        {prompt.isActive && (
                          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                            (Active)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(prompt.createdAt)}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3">
                      {prompt.prompt.substring(0, 120)}
                      {prompt.prompt.length > 120 && '...'}
                    </div>
                    
                    {!prompt.isActive && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Click to activate this version
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Usage Tips */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              💡 Testing Tips
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Try different sender personalities</li>
              <li>• Test urgent vs casual emails</li>
              <li>• Use "Load Sample" for quick examples</li>
              <li>• Check confidence scores for quality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 