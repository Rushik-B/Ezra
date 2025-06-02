import React, { useState, ChangeEvent } from 'react'
import { ChevronDown, Search, User, Settings as SettingsIcon, History as HistoryIcon, BarChart2, Zap, ShieldCheck, Edit3, X, RotateCcw, Check, MessageSquare, Calendar, RadioTower, FileText, Filter, Eye, ThumbsUp, ThumbsDown, AlertTriangle, Info, SlidersHorizontal, Palette, Clock, Users, LogOut, ExternalLink, Maximize2, Minimize2, Inbox, Send, Trash2, Archive, ChevronLeft, ChevronRight, Moon, Sun, AlignJustify, Briefcase, Brain, GitCommit, Copy, Download, Volume2, Mic, PlayCircle, PauseCircle, StopCircle, ListChecks, LayoutGrid, Columns, Rows, GripVertical, SlackIcon, CalendarIcon } from 'lucide-react';     

interface SettingsPageProps {
  autonomy: number
  setAutonomy: (value: number) => void
}

type DomainRule = { id: string; pattern: string; level: number }
type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
type WorkingHours = Record<DayKey, { start: string; end: string; active: boolean }>

interface Integration {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  connected: boolean
  scope: string
  lastSync: string
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  autonomy,
  setAutonomy,
}) => {
  // Per-domain rules
  const [domainInput, setDomainInput] = useState('')
  const [domainRules, setDomainRules] = useState<DomainRule[]>([])

  const addDomainRule = () => {
    const [pattern, lvl] = domainInput.split(':').map(s => s.trim())
    const level = parseInt(lvl, 10)
    if (pattern && !isNaN(level)) {
      setDomainRules(rules => [
        ...rules,
        { id: Date.now().toString(), pattern, level },
      ])
      setDomainInput('')
    }
  }

  // Working hours
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    Mon: { start: '09:00', end: '17:00', active: true },
    Tue: { start: '09:00', end: '17:00', active: true },
    Wed: { start: '09:00', end: '17:00', active: true },
    Thu: { start: '09:00', end: '17:00', active: true },
    Fri: { start: '09:00', end: '17:00', active: true },
    Sat: { start: '10:00', end: '14:00', active: false },
    Sun: { start: '10:00', end: '14:00', active: false },
  })

  const handleHoursChange = (
    day: DayKey,
    field: 'start' | 'end' | 'active',
    value: string | boolean
  ) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  // Integrations
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'slack',
      name: 'Slack',
      icon: SlackIcon,
      connected: true,
      scope: 'Read messages, Send replies',
      lastSync: '5m ago',
    },
    {
      id: 'notion',
      name: 'Notion',
      icon: FileText,
      connected: true,
      scope: 'Read pages, Create notes',
      lastSync: '1h ago',
    },
    {
      id: 'jira',
      name: 'Jira',
      icon: RadioTower,
      connected: false,
      scope: 'Read issues, Update status',
      lastSync: 'Never',
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      icon: CalendarIcon,
      connected: true,
      scope: 'Read events, Create events',
      lastSync: 'Just now',
    },
  ])

  const toggleIntegration = (id: string) => {
    setIntegrations(ints =>
      ints.map(i =>
        i.id === id ? { ...i, connected: !i.connected } : i
      )
    )
  }

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
        Settings
      </h2>

      {/* Autonomy */}
      <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Autonomy Controls
        </h3>
        <div className="space-y-4 max-w-md">
          <label
            htmlFor="globalAutonomy"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Global Autonomy Level
          </label>
          <div className="flex items-center space-x-3">
            <input
              id="globalAutonomy"
              type="range"
              min={0}
              max={100}
              value={autonomy}
              onChange={e => setAutonomy(+e.target.value)}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="w-12 text-right font-semibold text-emerald-600 dark:text-emerald-400">
              {autonomy}%
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Suggest</span>
            <span>Hybrid</span>
            <span>Autopilot</span>
          </div>

          {/* Per-domain */}
          <div>
            <label
              htmlFor="domainSettings"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-4"
            >
              Per-domain/contact Rules
            </label>
            <div className="flex space-x-2 mt-1">
              <input
                id="domainSettings"
                type="text"
                value={domainInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDomainInput(e.target.value)
                }
                placeholder="e.g. acme.com: 90"
                className="flex-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                onClick={addDomainRule}
                className="px-3 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-md"
              >
                Add
              </button>
            </div>
            {domainRules.length > 0 && (
              <ul className="mt-2 text-sm space-y-1">
                {domainRules.map(rule => (
                  <li
                    key={rule.id}
                    className="flex justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-1"
                  >
                    <span>
                      {rule.pattern} → {rule.level}%
                    </span>
                    <button
                      onClick={() =>
                        setDomainRules(rules =>
                          rules.filter(r => r.id !== rule.id)
                        )
                      }
                      className="text-red-500 hover:underline text-xs"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Working Hours */}
      <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Working Hours
        </h3>
        <div className="space-y-2 max-w-md">
          {(Object.keys(workingHours) as DayKey[]).map(day => {
            const hrs = workingHours[day]
            return (
              <div
                key={day}
                className="flex items-center space-x-3 p-2 even:bg-gray-50 dark:even:bg-gray-700/50 rounded"
              >
                <label className="flex items-center space-x-2 w-24">
                  <input
                    type="checkbox"
                    checked={hrs.active}
                    onChange={e =>
                      handleHoursChange(day, 'active', e.target.checked)
                    }
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {day}
                  </span>
                </label>
                <input
                  type="time"
                  value={hrs.start}
                  disabled={!hrs.active}
                  onChange={e =>
                    handleHoursChange(day, 'start', e.target.value)
                  }
                  className={`w-24 p-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded ${
                    !hrs.active ? 'opacity-50 cursor-not-allowed' : ''
                  } focus:ring-emerald-500 focus:border-emerald-500`}
                />
                <span
                  className={`text-sm text-gray-500 dark:text-gray-400 ${
                    !hrs.active ? 'opacity-50' : ''
                  }`}
                >
                  to
                </span>
                <input
                  type="time"
                  value={hrs.end}
                  disabled={!hrs.active}
                  onChange={e =>
                    handleHoursChange(day, 'end', e.target.value)
                  }
                  className={`w-24 p-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded ${
                    !hrs.active ? 'opacity-50 cursor-not-allowed' : ''
                  } focus:ring-emerald-500 focus:border-emerald-500`}
                />
              </div>
            )
          })}
        </div>
      </section>

      {/* Integrations */}
      <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Integrations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map(intg => {
            const Icon = intg.icon
            return (
              <div
                key={intg.id}
                className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <Icon
                  className={`h-8 w-8 mt-1 ${
                    intg.connected ? 'text-emerald-500' : 'text-gray-400'
                  }`}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-800 dark:text-white">
                      {intg.name}
                    </h4>
                    <label
                      htmlFor={`toggle-${intg.id}`}
                      className="inline-flex relative items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id={`toggle-${intg.id}`}
                        className="sr-only peer"
                        checked={intg.connected}
                        onChange={() => toggleIntegration(intg.id)}
                      />
                      <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Scope: {intg.scope}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      intg.connected
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {intg.connected
                      ? `Last sync: ${intg.lastSync}`
                      : 'Not connected'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Data Export */}
      <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Data Management
        </h3>
        <div className="space-y-3 max-w-md">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Download your prompt vault or action logs for compliance or backup.
          </p>
          <div className="flex space-x-2">
            <button className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded shadow-sm">
              <Download size={14} className="mr-1" />
              Export Prompt Vault
            </button>
            <button className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded shadow-sm">
              <Download size={14} className="mr-1" />
              Export Action Logs
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
