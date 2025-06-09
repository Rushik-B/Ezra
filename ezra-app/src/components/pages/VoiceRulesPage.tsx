'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Wand2,
  Brain,
  Save,
  History,
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
  metadata?: Record<string, unknown>;
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
  const [showHistory, setShowHistory] = useState(false);

  // Interaction Network
  const [interactionNetwork, setInteractionNetwork] = useState<InteractionNetwork | null>(null);
  const [editedNetwork, setEditedNetwork] = useState('');

  // Strategic Rulebook
  const [strategicRulebook, setStrategicRulebook] = useState<StrategicRulebook | null>(null);
  const [editedRulebook, setEditedRulebook] = useState('');

  // Misc UI
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test AI - removed unused variables

  /* ------------------------- side effects ------------------------- */
  useEffect(() => {
    if (!session) return;
    fetchCurrentPrompt();
    fetchPromptHistory();
    fetchInteractionNetwork();
    fetchStrategicRulebook();
  }, [session]);

  /* --------------------------- helpers --------------------------- */
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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

  /* ---------------------- fetch / save logic ---------------------- */
  const fetchCurrentPrompt = async () => {
    try {
      const r = await fetch('/api/master-prompt');
      if (!r.ok) throw new Error();
      const data = await r.json();
      setCurrentPrompt(data);
      setEditedPrompt(data.prompt);
      setIsDefault(!!data.isDefault);
    } catch {
      setError('Failed to fetch Master Prompt');
    }
  };
  const fetchPromptHistory = async () => {
    try {
      const r = await fetch('/api/master-prompt/history');
      if (!r.ok) throw new Error();
      const data = await r.json();
      setPromptHistory(data.prompts || []);
    } finally {
      setIsLoading(false);
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
    } catch {
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
    } catch {
      console.log('No strategic rulebook found, will create empty one');
      setEditedRulebook(JSON.stringify({ rules: [] }, null, 2));
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
      const method =
        currentPrompt?.isGenerated && currentPrompt?.id ? 'PUT' : 'POST';
      const body =
        method === 'PUT'
          ? {
              prompt: editedPrompt.trim(),
              promptId: currentPrompt?.id,
              isDistilledEdit: true,
            }
          : { prompt: editedPrompt.trim() };
      const r = await fetch('/api/master-prompt', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      await fetchCurrentPrompt();
      await fetchPromptHistory();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };
  const saveInteractionNetwork = async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch('/api/pos/interaction-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: JSON.parse(editedNetwork) }),
      });
      if (r.ok) {
        fetchInteractionNetwork();
      } else {
        const errorData = await r.json();
        setError(errorData.error || 'Failed to save Interaction Network');
      }
    } catch {
      setError('Failed to save Interaction Network. Invalid JSON format?');
    } finally {
      setSaving(false);
    }
  };
  const saveStrategicRulebook = async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch('/api/pos/strategic-rulebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: JSON.parse(editedRulebook) }),
      });
      if (r.ok) {
        fetchStrategicRulebook();
      } else {
        const errorData = await r.json();
        setError(errorData.error || 'Failed to save Strategic Rulebook');
      }
    } catch {
      setError('Failed to save Strategic Rulebook. Invalid JSON format?');
    } finally {
      setSaving(false);
    }
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
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Prompt-History modal */}
      {showHistory && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <History className="w-4 h-4 mr-2" />
                Prompt History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Version</th>
                    <th className="px-4 py-2 font-medium text-gray-700">Date</th>
                    <th className="px-4 py-2 font-medium text-gray-700">Source</th>
                    <th className="px-4 py-2 font-medium text-gray-700">Chars</th>
                  </tr>
                </thead>
                <tbody>
                  {promptHistory.map((p) => (
                    <tr key={p.id} className="border-b even:bg-gray-50">
                      <td className="px-4 py-2 text-gray-800">v{p.version}</td>
                      <td className="px-4 py-2 text-gray-600">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {p.isGenerated ? 'AI' : 'Manual'}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{p.prompt.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================= Page ========================= */}
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="flex-1 mb-6 lg:mb-0">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2 flex items-center">
              <Brain className="w-8 h-8 mr-3 text-blue-600" />
              Voice and Rules Configuration
            </h1>
            <p className="text-gray-600 max-w-2xl leading-relaxed">
              Configure your AI assistant&apos;s personality, relationships, and rules.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* =================== Editor + Tabs ===================== */}
          <div className="xl:col-span-3 space-y-6">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center flex-1 space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${getTabColorClasses(
                      tab.id,
                      isActive,
                    )}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* --------------- MASTER PROMPT ----------------------- */}
            {activeTab === 'master-prompt' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md flex flex-col h-[calc(100vh-300px)]">
                {/* header */}
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
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center text-xs text-gray-600 hover:text-blue-600"
                  >
                    <History className="w-4 h-4 mr-1" />
                    History
                  </button>
                </div>

                {/* textarea */}
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  placeholder="Enter your AI&apos;s personality instructions here…"
                  className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* footer */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-gray-500">{editedPrompt.length} chars</span>
                  <button
                    onClick={savePrompt}
                    disabled={isSaving || !editedPrompt.trim()}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl disabled:opacity-50 transition-colors flex items-center font-medium shadow-sm"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {/* --------------- INTERACTION NETWORK ---------------- */}
            {activeTab === 'interaction-network' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md flex flex-col h-[calc(100vh-300px)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Interaction Network</h3>
                      <p className="text-xs text-gray-500">
                        Define your professional contacts and their roles
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
  "contacts":[
    {
      "email":"colleague@company.com",
      "name":"John Doe",
      "role":"Project Manager",
      "functions":["PROJECT_UPDATES","TASK_COORDINATION"]
    }
  ]
}`}
                  className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none font-mono text-sm leading-relaxed focus:ring-2 focus:ring-purple-700/50 focus:border-purple-700/50"
                />

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs text-gray-500">JSON format</span>
                  <button
                    onClick={saveInteractionNetwork}
                    disabled={isSaving || !editedNetwork.trim()}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50 transition-colors flex items-center font-medium shadow-sm"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving…' : 'Save Network'}
                  </button>
                </div>
              </div>
            )}

            {/* --------------- STRATEGIC RULEBOOK ------------------ */}
            {activeTab === 'strategic-rulebook' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md flex flex-col h-[calc(100vh-300px)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <ListChecks className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Strategic Rulebook</h3>
                      <p className="text-xs text-gray-500">
                        IF / THEN rules to guide the AI
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
  "rules":[
    {
      "if":"email contains scheduling request",
      "then":"send calendar link and suggest 3 time slots",
      "priority":"high"
    }
  ]
}`}
                  className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none font-mono text-sm leading-relaxed focus:ring-2 focus:ring-green-700/50 focus:border-green-700/50"
                />

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs text-gray-500">JSON format</span>
                  <button
                    onClick={saveStrategicRulebook}
                    disabled={isSaving || !editedRulebook.trim()}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50 transition-colors flex items-center font-medium shadow-sm"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving…' : 'Save Rulebook'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ====================== Sidebar (AI tester) ============== */}
          {/* (unchanged – your existing test-email panel goes here) */}
        </div>
      </div>
    </>
  );
};
