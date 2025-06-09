'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Wand2,
  Brain,
  Sparkles,
  Eye,
  Play,
  Save,
  Bot,
  Zap,
  TestTube,
  Users,
  ListChecks,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Tabs                                                              */
/* ------------------------------------------------------------------ */
const tabs = [
  { id: 'master-prompt', label: 'Master Prompt', icon: Wand2, color: 'blue' },
  { id: 'interaction-network', label: 'Interaction Network', icon: Users, color: 'purple' },
  { id: 'strategic-rulebook', label: 'Strategic Rulebook', icon: ListChecks, color: 'green' },
] as const;

type TabId = typeof tabs[number]['id'];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export const VoiceRulesPage: React.FC = () => {
  const { data: session } = useSession();

  /* ---------------------------- state ---------------------------- */
  const [activeTab, setActiveTab] = useState<TabId>('master-prompt');

  // Master Prompt
  const [currentPrompt, setCurrentPrompt] = useState<MasterPrompt | null>(null);
  const [promptHistory, setPromptHistory] = useState<MasterPrompt[]>([]);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Interaction Network
  const [interactionNetwork, setInteractionNetwork] =
    useState<InteractionNetwork | null>(null);
  const [editedNetwork, setEditedNetwork] = useState('');

  // Strategic Rulebook
  const [strategicRulebook, setStrategicRulebook] =
    useState<StrategicRulebook | null>(null);
  const [editedRulebook, setEditedRulebook] = useState('');

  // Misc UI
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test-reply generation
  const [isTestingReply, setIsTestingReply] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState<CustomEmailForm>({
    from: 'sara@starboard.ai',
    subject: 'Deployment update',
    body: `Hi all,

Quick update – the maintenance window with Globex went smoothly.

Alex's team completed the deployment at 12:28 AM PST. Validation steps were finalized shortly after, and we received confirmation from the Globex EU team that data-integrity checks are passing on their end. No anomalies reported post-push.

Thanks everyone for the coordination and late-night support.

Best,
Sara`,
  });

  /* ------------------------- side effects ------------------------- */
  useEffect(() => {
    if (!session) return;
    fetchCurrentPrompt();
    fetchPromptHistory();
    fetchInteractionNetwork();
    fetchStrategicRulebook();
  }, [session]);

  /* --------------------------- fetchers --------------------------- */
  const fetchCurrentPrompt = async () => {
    try {
      const res = await fetch('/api/master-prompt');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCurrentPrompt(data);
      setEditedPrompt(data.prompt);
      setIsDefault(!!data.isDefault);
    } catch {
      setError('Failed to fetch current prompt');
    }
  };

  const fetchPromptHistory = async () => {
    try {
      const res = await fetch('/api/master-prompt/history');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPromptHistory(data.prompts || []);
    } catch {
      console.error('Failed to fetch prompt history');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInteractionNetwork = async () => {
    try {
      const res = await fetch('/api/pos/interaction-network');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInteractionNetwork(data);
      setEditedNetwork(JSON.stringify(data.content, null, 2));
    } catch {
      setEditedNetwork(JSON.stringify({ contacts: [] }, null, 2)); // start blank
    }
  };

  const fetchStrategicRulebook = async () => {
    try {
      const res = await fetch('/api/pos/strategic-rulebook');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStrategicRulebook(data);
      setEditedRulebook(JSON.stringify(data.content, null, 2));
    } catch {
      setEditedRulebook(JSON.stringify({ rules: [] }, null, 2)); // start blank
    }
  };

  /* --------------------------- savers ---------------------------- */
  const savePrompt = async () => {
    if (!editedPrompt.trim()) {
      setError('Prompt cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const method =
        currentPrompt?.isGenerated && currentPrompt?.id ? 'PUT' : 'POST';
      const payload =
        method === 'PUT'
          ? {
              prompt: editedPrompt.trim(),
              promptId: currentPrompt?.id,
              isDistilledEdit: true,
            }
          : { prompt: editedPrompt.trim() };

      const res = await fetch('/api/master-prompt', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save prompt');
      }

      await fetchCurrentPrompt();
      await fetchPromptHistory();
      setIsDefault(false);
    } catch (e: any) {
      setError(e.message || 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  const saveInteractionNetwork = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/pos/interaction-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: JSON.parse(editedNetwork) }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error);
      }
      fetchInteractionNetwork();
    } catch {
      setError('Failed to save Interaction Network. Invalid JSON?');
    } finally {
      setSaving(false);
    }
  };

  const saveStrategicRulebook = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/pos/strategic-rulebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: JSON.parse(editedRulebook) }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error);
      }
      fetchStrategicRulebook();
    } catch {
      setError('Failed to save Strategic Rulebook. Invalid JSON?');
    } finally {
      setSaving(false);
    }
  };

  /* --------------------- reply-generation test -------------------- */
  const testReplyGeneration = async () => {
    setIsTestingReply(true);
    setTestResult(null);
    setTestError(null);
    try {
      const res = await fetch('/api/test-reply-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customEmail }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error);
      }
      setTestResult(await res.json());
    } catch (e: any) {
      setTestError(e.message || 'Failed to test reply generation');
    } finally {
      setIsTestingReply(false);
    }
  };

  const loadSampleEmails = () => {
    const samples = [
      {
        from: 'boss@company.com',
        subject: 'Urgent: Project Status Update',
        body: `Hi there,

I need an update on the current project status by end of day:

1. Current progress %
2. Any blockers
3. Expected completion

Thanks!`,
      },
      {
        from: 'client@bigcorp.com',
        subject: 'Meeting Reschedule Request',
        body: `Hello,

I need to reschedule our meeting planned for Thursday 2 pm.

Could we move it to Friday same time?

Best,
Sarah`,
      },
      {
        from: 'team@startup.io',
        subject: 'Quick Question about Feature',
        body: `Hey!

Quick question – should we add the dark-mode toggle to the header or settings?

Thanks!
Alex`,
      },
    ];
    setCustomEmail(samples[Math.floor(Math.random() * samples.length)]);
  };

  /* --------------------------- helpers --------------------------- */
  const getTabColorClasses = (tabId: TabId, isActive: boolean) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return '';

    const palette = {
      blue: isActive
        ? 'bg-blue-500/10 border border-blue-500 text-blue-600'
        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-100',
      purple: isActive
        ? 'bg-purple-500/10 border border-purple-500 text-purple-700'
        : 'text-gray-500 hover:text-purple-700 hover:bg-purple-100',
      green: isActive
        ? 'bg-green-500/10 border border-green-500 text-green-700'
        : 'text-gray-500 hover:text-green-700 hover:bg-green-100',
    } as const;

    return palette[tab.color];
  };

  /* -------------------------- rendering -------------------------- */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-6">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="text-lg font-medium text-gray-700">Loading AI configuration…</p>
          <p className="text-sm text-gray-500 mt-2">Initializing neural pathways</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                          */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
        <div className="flex-1 mb-6 lg:mb-0">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-blue-600" />
            Voice and Rules Configuration
          </h1>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Configure your AI assistant’s personality, behavior, and response patterns. Train it to
            respond like you.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Main Grid                                                        */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* ========================= Editor + Tabs ===================== */}
        <div className="xl:col-span-3 space-y-6">
          {/* --- Tab Navigation ---------------------------------------- */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-2xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center flex-1 space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${getTabColorClasses(
                    tab.id,
                    isActive,
                  )}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* --- Tab Content Wrapper ----------------------------------- */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 h-[calc(100vh-300px)] shadow-md overflow-hidden flex flex-col">
            {/* -------------- Master Prompt --------------------------- */}
            {activeTab === 'master-prompt' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Master Prompt{' '}
                        {isDefault && <span className="text-sm text-gray-500">(Default)</span>}
                      </h3>
                      {currentPrompt?.isGenerated && (
                        <span className="text-sm text-blue-600">AI-Generated</span>
                      )}
                    </div>
                  </div>
                  {currentPrompt && !isDefault && (
                    <span className="text-sm text-gray-500">v{currentPrompt.version}</span>
                  )}
                </div>

                {currentPrompt?.isGenerated && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <Bot className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        AI-Generated Master Prompt
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      This prompt was automatically generated by analyzing your email history.
                      You’re editing a simplified version — changes will be intelligently applied to
                      the full prompt.
                      {currentPrompt.metadata?.emailsAnalyzed && (
                        <span className="block mt-1">
                          Based on {currentPrompt.metadata.emailsAnalyzed} sent emails.
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Textarea */}
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  placeholder="Enter your AI's personality and behavior instructions here…"
                  className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm text-gray-900 leading-relaxed"
                />

                {/* Error */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {editedPrompt.length} characters
                    {currentPrompt?.isGenerated && (
                      <span className="ml-2 text-blue-600">• editing simplified version</span>
                    )}
                  </span>
                  <button
                    onClick={savePrompt}
                    disabled={isSaving || !editedPrompt.trim()}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium shadow-sm"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving
                      ? 'Saving…'
                      : currentPrompt?.isGenerated
                      ? 'Apply Changes'
                      : 'Save Prompt'}
                  </button>
                </div>
              </div>
            )}

            {/* -------------- Interaction Network -------------------- */}
            {activeTab === 'interaction-network' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Interaction Network</h3>
                      <p className="text-sm text-gray-500">
                        Define your professional relationships and their functions
                      </p>
                    </div>
                  </div>
                  {interactionNetwork && (
                    <span className="text-sm text-gray-500">
                      v{interactionNetwork.version}
                    </span>
                  )}
                </div>

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
                  className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-700/50 focus:border-purple-700/50 font-mono text-sm text-gray-900 leading-relaxed"
                />

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-gray-500">JSON format</span>
                  <button
                    onClick={saveInteractionNetwork}
                    disabled={isSaving || !editedNetwork.trim()}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium shadow-sm"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving…' : 'Save Network'}
                  </button>
                </div>
              </div>
            )}

            {/* -------------- Strategic Rulebook --------------------- */}
            {activeTab === 'strategic-rulebook' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <ListChecks className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Strategic Rulebook</h3>
                      <p className="text-sm text-gray-500">
                        Define IF/THEN rules and workflows
                      </p>
                    </div>
                  </div>
                  {strategicRulebook && (
                    <span className="text-sm text-gray-500">
                      v{strategicRulebook.version}
                    </span>
                  )}
                </div>

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
                  className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-green-700/50 focus:border-green-700/50 font-mono text-sm text-gray-900 leading-relaxed"
                />

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-gray-500">JSON format</span>
                  <button
                    onClick={saveStrategicRulebook}
                    disabled={isSaving || !editedRulebook.trim()}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium shadow-sm"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving…' : 'Save Rulebook'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================ Sidebar ====================== */}
        <div className="space-y-6">
          {/* --- Test AI --------------------------------------------- */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <TestTube className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Test AI Response</h3>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Test how your AI will respond to different emails.
            </p>

            {/* Form */}
            <div className="space-y-4 mb-4">
              <label className="block text-xs font-medium text-gray-700">
                From
                <input
                  type="email"
                  value={customEmail.from}
                  onChange={(e) => setCustomEmail({ ...customEmail, from: e.target.value })}
                  placeholder="boss@company.com"
                  className="w-full p-2 mt-1 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 text-xs"
                />
              </label>

              <label className="block text-xs font-medium text-gray-700">
                Subject
                <input
                  type="text"
                  value={customEmail.subject}
                  onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                  placeholder="Project update"
                  className="w-full p-2 mt-1 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 text-xs"
                />
              </label>

              <label className="block text-xs font-medium text-gray-700">
                Email Body
                <textarea
                  rows={4}
                  value={customEmail.body}
                  onChange={(e) => setCustomEmail({ ...customEmail, body: e.target.value })}
                  placeholder="Enter email content…"
                  className="w-full p-2 mt-1 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 text-xs resize-none leading-relaxed"
                />
              </label>
            </div>

            <div className="flex space-x-2 mb-4">
              <button
                onClick={loadSampleEmails}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Load Sample
              </button>
              <button
                onClick={testReplyGeneration}
                disabled={
                  isTestingReply ||
                  !customEmail.from.trim() ||
                  !customEmail.subject.trim() ||
                  !customEmail.body.trim()
                }
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Play size={12} className="mr-1" />
                {isTestingReply ? 'Testing…' : 'Test'}
              </button>
            </div>

            {/* Errors / Results */}
            {testError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {testError}
              </div>
            )}

            {testResult && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                    <Eye size={12} className="mr-1" />
                    Test Email
                  </h4>
                  <div className="text-xs font-mono leading-relaxed space-y-1">
                    <div>
                      <span className="text-gray-500">From:</span>{' '}
                      <span className="text-gray-900">{testResult.testEmail.from}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Subject:</span>{' '}
                      <span className="text-gray-900">{testResult.testEmail.subject}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h4 className="text-xs font-medium text-emerald-700 mb-2 flex items-center">
                    <Zap size={12} className="mr-1" />
                    AI Reply
                  </h4>
                  <pre className="text-xs text-emerald-800 bg-white p-2 rounded border border-emerald-200 font-mono max-h-32 overflow-y-auto">
                    {testResult.generatedReply.reply}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* --- Tips ------------------------------------------------- */}
          <div className="bg-gradient-to-br from-blue-50 to-gray-50 border border-blue-200 rounded-2xl p-4">
            <h4 className="text-xs font-medium text-blue-800 mb-2 flex items-center">
              <Sparkles size={12} className="mr-1" />
              Configuration Tips
            </h4>
            <ul className="space-y-1 text-xs text-blue-700">
              <li>• Be specific about tone and style</li>
              <li>• Include response examples</li>
              <li>• Test with different scenarios</li>
              <li>• Use “Load Sample” for quick tests</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
