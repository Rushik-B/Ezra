'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Wand2, Brain, Sparkles, Eye, Play, Save, History, Bot, Zap, TestTube, Users, ListChecks } from 'lucide-react';

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

interface InteractionNetwork {
  id: string;
  content: object;
  version: number;
  isActive: boolean;
}

interface StrategicRulebook {
  id: string;
  content: object;
  version: number;
  isActive: boolean;
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

// Tab definitions
const tabs = [
  { id: 'master-prompt', label: 'Master Prompt', icon: Wand2, color: 'blue' },
  { id: 'interaction-network', label: 'Interaction Network', icon: Users, color: 'purple' },
  { id: 'strategic-rulebook', label: 'Strategic Rulebook', icon: ListChecks, color: 'green' },
] as const;

type TabId = typeof tabs[number]['id'];

export const VoiceRulesPage: React.FC = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>('master-prompt');
  const [currentPrompt, setCurrentPrompt] = useState<MasterPrompt | null>(null);
  const [interactionNetwork, setInteractionNetwork] = useState<InteractionNetwork | null>(null);
  const [strategicRulebook, setStrategicRulebook] = useState<StrategicRulebook | null>(null);
  const [promptHistory, setPromptHistory] = useState<MasterPrompt[]>([]);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [editedNetwork, setEditedNetwork] = useState('');
  const [editedRulebook, setEditedRulebook] = useState('');
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
      fetchInteractionNetwork();
      fetchStrategicRulebook();
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

  const fetchInteractionNetwork = async () => {
    try {
      const response = await fetch('/api/pos/interaction-network');
      if (response.ok) {
        const data = await response.json();
        setInteractionNetwork(data);
        setEditedNetwork(JSON.stringify(data.content, null, 2));
      }
    } catch (_err) {
      console.log('No interaction network found, will create empty one');
      setEditedNetwork(JSON.stringify({ contacts: [] }, null, 2));
    }
  };

  const fetchStrategicRulebook = async () => {
    try {
      const response = await fetch('/api/pos/strategic-rulebook');
      if (response.ok) {
        const data = await response.json();
        setStrategicRulebook(data);
        setEditedRulebook(JSON.stringify(data.content, null, 2));
      }
    } catch (_err) {
      console.log('No strategic rulebook found, will create empty one');
      setEditedRulebook(JSON.stringify({ rules: [] }, null, 2));
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

  const saveInteractionNetwork = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/pos/interaction-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: JSON.parse(editedNetwork) })
      });
      if (response.ok) {
        fetchInteractionNetwork();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save Interaction Network');
      }
    } catch (err) {
      setError('Failed to save Interaction Network. Invalid JSON format?');
    } finally {
      setSaving(false);
    }
  };

  const saveStrategicRulebook = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/pos/strategic-rulebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: JSON.parse(editedRulebook) })
      });
      if (response.ok) {
        fetchStrategicRulebook();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save Strategic Rulebook');
      }
    } catch (err) {
      setError('Failed to save Strategic Rulebook. Invalid JSON format?');
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

  const getTabColorClasses = (tabId: TabId, isActive: boolean) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return '';
    
    const colors = {
      blue: isActive 
        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' 
        : 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10',
      purple: isActive 
        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
        : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10',
      green: isActive 
        ? 'bg-green-500/20 border-green-500/50 text-green-300' 
        : 'text-slate-400 hover:text-green-300 hover:bg-green-500/10'
    };
    
    return colors[tab.color];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-6">
            <div className="w-12 h-12 border-2 border-slate-700 border-t-indigo-400 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-slate-300">Loading AI configuration...</p>
          <p className="text-sm text-slate-500 mt-2">Initializing neural pathways</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="flex-1 mb-6 lg:mb-0">
            <h1 className="text-3xl font-semibold text-white mb-2 flex items-center">
              <Brain className="w-8 h-8 mr-3 text-blue-400" />
              Voice and Rules Configuration
            </h1>
            <p className="text-slate-400 max-w-2xl leading-relaxed">
              Configure your AI assistant's personality, behavior, and response patterns. Train it to respond like you.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content - 3/4 width */}
          <div className="xl:col-span-3">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-slate-800/30 p-1 rounded-2xl">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 flex-1 justify-center border ${getTabColorClasses(tab.id, isActive)}`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-8 h-[calc(100vh-300px)]">
              {/* Master Prompt Tab */}
              {activeTab === 'master-prompt' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Wand2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Master Prompt {isDefault && <span className="text-sm text-slate-400">(Default)</span>}
                        </h3>
                        {currentPrompt?.isGenerated && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-blue-400">
                              AI-Generated
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {currentPrompt && !isDefault && (
                        <span className="text-sm text-slate-400">
                          v{currentPrompt.version}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {currentPrompt?.isGenerated && (
                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <div className="flex items-center space-x-3 mb-2">
                        <Bot className="w-5 h-5 text-blue-400" />
                        <div className="font-medium text-blue-200">AI-Generated Master Prompt</div>
                      </div>
                      <div className="text-sm text-blue-300/80">
                        This prompt was automatically generated by analyzing your email history. 
                        You're editing a simplified version - changes will be intelligently applied to the full prompt.
                        {currentPrompt.metadata?.emailsAnalyzed && (
                          <span className="block mt-1">
                            Based on {currentPrompt.metadata.emailsAnalyzed} sent emails.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col flex-1">
                    <textarea
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      placeholder="Enter your AI's personality and behavior instructions here..."
                      className="flex-1 p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl resize-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white placeholder-slate-400 font-mono text-sm leading-relaxed"
                    />
                    
                    {error && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="text-sm text-red-300">
                          {error}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-slate-400">
                        {editedPrompt.length} characters
                        {currentPrompt?.isGenerated && (
                          <span className="ml-2 text-blue-400">
                            • Editing simplified version
                          </span>
                        )}
                      </div>
                      <button
                        onClick={savePrompt}
                        disabled={isSaving || !editedPrompt.trim()}
                        className="px-6 py-3 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium"
                      >
                        <Save size={16} className="mr-2" />
                        {isSaving ? 'Saving...' : currentPrompt?.isGenerated ? 'Apply Changes' : 'Save Prompt'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Interaction Network Tab */}
              {activeTab === 'interaction-network' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Interaction Network</h3>
                        <p className="text-sm text-slate-400">Define your professional relationships and their functions</p>
                      </div>
                    </div>
                    {interactionNetwork && (
                      <span className="text-sm text-slate-400">
                        v{interactionNetwork.version}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col flex-1">
                    <textarea
                      value={editedNetwork}
                      onChange={(e) => setEditedNetwork(e.target.value)}
                      placeholder={`{
  "contacts": [
    {
      "email": "colleague@company.com",
      "name": "John Doe",
      "role": "Project Manager",
      "functions": ["PROJECT_UPDATES", "TASK_COORDINATION"]
    }
  ]
}`}
                      className="flex-1 p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl resize-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 text-white placeholder-slate-400 font-mono text-sm leading-relaxed"
                    />
                    
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-slate-400">
                        JSON format - Define contacts and their business functions
                      </div>
                      <button
                        onClick={saveInteractionNetwork}
                        disabled={isSaving || !editedNetwork.trim()}
                        className="px-6 py-3 bg-purple-500/80 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium"
                      >
                        <Save size={16} className="mr-2" />
                        {isSaving ? 'Saving...' : 'Save Network'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Strategic Rulebook Tab */}
              {activeTab === 'strategic-rulebook' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <ListChecks className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Strategic Rulebook</h3>
                        <p className="text-sm text-slate-400">Define rules and workflows for different situations</p>
                      </div>
                    </div>
                    {strategicRulebook && (
                      <span className="text-sm text-slate-400">
                        v{strategicRulebook.version}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col flex-1">
                    <textarea
                      value={editedRulebook}
                      onChange={(e) => setEditedRulebook(e.target.value)}
                      placeholder={`{
  "rules": [
    {
      "if": "email contains scheduling request",
      "then": "send calendar link and suggest 3 time slots",
      "priority": "high"
    }
  ]
}`}
                      className="flex-1 p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl resize-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 text-white placeholder-slate-400 font-mono text-sm leading-relaxed"
                    />
                    
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-slate-400">
                        JSON format - Define IF/THEN rules for strategic decision making
                      </div>
                      <button
                        onClick={saveStrategicRulebook}
                        disabled={isSaving || !editedRulebook.trim()}
                        className="px-6 py-3 bg-green-500/80 hover:bg-green-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium"
                      >
                        <Save size={16} className="mr-2" />
                        {isSaving ? 'Saving...' : 'Save Rulebook'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - 1/4 width */}
          <div className="space-y-6">
            {/* Test Environment */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <TestTube className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    Test AI Response
                  </h3>
                </div>
              </div>
              
              <p className="text-xs text-slate-400 mb-4">
                Test how your AI will respond to different emails.
              </p>

              {/* Test Email Form */}
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    From
                  </label>
                  <input
                    type="email"
                    value={customEmail.from}
                    onChange={(e) => setCustomEmail({ ...customEmail, from: e.target.value })}
                    placeholder="boss@company.com"
                    className="w-full p-2 bg-slate-900/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white text-xs"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={customEmail.subject}
                    onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                    placeholder="Project Update"
                    className="w-full p-2 bg-slate-900/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white text-xs"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Body
                  </label>
                  <textarea
                    value={customEmail.body}
                    onChange={(e) => setCustomEmail({ ...customEmail, body: e.target.value })}
                    placeholder="Enter email content..."
                    rows={4}
                    className="w-full p-2 bg-slate-900/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white text-xs resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex space-x-2 mb-4">
                <button
                  onClick={loadSampleEmails}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
                >
                  Load Sample
                </button>
                <button
                  onClick={testReplyGeneration}
                  disabled={isTestingReply || !customEmail.from.trim() || !customEmail.subject.trim() || !customEmail.body.trim()}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500/80 hover:bg-blue-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Play size={12} className="mr-1" />
                  {isTestingReply ? 'Testing...' : 'Test'}
                </button>
              </div>

              {testError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="text-xs text-red-300">
                    {testError}
                  </div>
                </div>
              )}

              {testResult && (
                <div className="mt-4 space-y-4">
                  <div className="p-3 bg-slate-900/30 border border-slate-700/30 rounded-lg">
                    <h4 className="text-xs font-medium text-slate-300 mb-2 flex items-center">
                      <Eye size={12} className="mr-1" />
                      Test Email
                    </h4>
                    <div className="text-xs space-y-1 font-mono">
                      <div><span className="text-slate-400">From:</span> <span className="text-white">{testResult.testEmail.from}</span></div>
                      <div><span className="text-slate-400">Subject:</span> <span className="text-white">{testResult.testEmail.subject}</span></div>
                    </div>
                  </div>

                  <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg">
                    <h4 className="text-xs font-medium text-emerald-200 mb-2 flex items-center">
                      <Zap size={12} className="mr-1" />
                      AI Reply
                    </h4>
                    <div className="text-xs text-emerald-100 bg-slate-950/30 p-2 rounded border border-emerald-500/20 font-mono leading-relaxed max-h-32 overflow-y-auto">
                      {testResult.generatedReply.reply}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-500/10 to-slate-500/10 border border-blue-500/20 rounded-2xl p-4">
              <h4 className="text-xs font-medium text-blue-200 mb-2 flex items-center">
                <Sparkles size={12} className="mr-1" />
                Configuration Tips
              </h4>
              <ul className="space-y-1 text-xs text-blue-300/80">
                <li>• Be specific about tone and style</li>
                <li>• Include response examples</li>
                <li>• Test with different scenarios</li>
                <li>• Use "Load Sample" for quick tests</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 