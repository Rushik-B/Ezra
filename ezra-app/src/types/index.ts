export interface User {
  name: string;
  avatar: string;
  status: string;
}

export interface QueueItem {
  id: string;
  sender: string;
  senderAvatar: string;
  actionSummary: string;
  confidence: number;
  status: 'auto-approved' | 'needs-attention' | 'snoozed' | 'manual';
  draftPreview: string;
  fullDraft: string;
  reason: string;
  timestamp: string;
}

export interface HistoryItem {
  id: string;
  statusIcon: React.ReactNode;
  timestamp: string;
  summary: string;
  fullContext: string;
  promptState: string;
  feedback: string;
}

export interface Metrics {
  autonomyOverTime: number[];
  keyMetrics: {
    emailsHandled: number;
    averageConfidence: string;
    timeSaved: string;
    errorRate: string;
    editsNeeded: number;
  };
  autonomyBreakdown: {
    auto: number;
    manual: number;
    snoozed: number;
  };
}

export interface PromptVersion {
  id: string;
  version: number;
  date: string;
  editor: string;
  reason: string;
  active: boolean;
  settings: {
    tone: string;
    formality: string;
    signOff: string;
    emojiUsage: number;
  };
}

export interface WorkingHours {
  [key: string]: {
    start: string;
    end: string;
    active: boolean;
  };
}

export interface Integration {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  connected: boolean;
  scope: string;
  lastSync: string;
}

export interface EmailStats {
  emailCount: number;
  threadCount: number;
}

export type PageType = 'queue' | 'history' | 'metrics' | 'voice' | 'settings'; 