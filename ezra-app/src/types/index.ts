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

// New types for Calendar Service
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  status: 'confirmed' | 'tentative' | 'cancelled';
  location?: string;
}

export interface CalendarAvailability {
  isFree: boolean;
  conflictingEvents: CalendarEvent[];
  suggestedTimes?: Array<{
    start: string;
    end: string;
  }>;
}

// New types for Context Engine
export interface EmailContextQuery {
  keywords?: string[];
  senderFilter?: string[];
  dateWindowHint?: string;
  hasAttachment?: boolean;
  maxResults?: number;
}

export interface IncomingEmailScannerOutput {
  needsCalendarCheck: boolean;
  calendarParameters?: {
    dateHint?: string;
    durationHint?: string;
    attendees?: string[];
  };
  emailContextQuery: EmailContextQuery;
  urgencyLevel: 'low' | 'medium' | 'high';
  primaryIntent: 'scheduling' | 'information_request' | 'problem_report' | 'status_update' | 'follow_up' | 'other';
  reasoning: string;
}

export interface FinalContextOutput {
  contextualDraft: string;
  suggestedActions: string[];
  confidenceScore: number;
  reasoning: string;
  keyFactsUsed: string[];
}

export interface ContextualInformation {
  calendarData?: {
    availability: CalendarAvailability;
    relevantEvents: CalendarEvent[];
    summary: string;
  };
  emailContext: {
    relevantEmails: Array<{
      from: string;
      to: string[];
      subject: string;
      body: string;
      date: Date;
      isSent: boolean;
      snippet: string;
    }>;
    summary: string;
  };
  scannerOutput: IncomingEmailScannerOutput;
  finalContext: FinalContextOutput;
} 