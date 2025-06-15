import { prisma } from './prisma';

export interface EmailMessage {
  messageId: string;
  labelIds?: string[];
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  headers?: { name: string; value: string }[];
}

export interface FilterResult {
  shouldReply: boolean;
  reason: string;
  category: 'allowed' | 'blocked' | 'filtered';
}

export class EmailFilterService {
  private static ALWAYS_BLOCKED_LABELS = [
    'CATEGORY_PROMOTIONS',   // Ads, newsletters
    'CATEGORY_SOCIAL',       // Social network notifications
    'CATEGORY_FORUMS',       // Mailing lists, group emails
    'CATEGORY_UPDATES',      // Receipts, auto-notifications
    'SPAM'                   // Spam emails
  ];

  private static BLOCKED_SENDER_PATTERNS = [
    /no-reply@/i,
    /notification@/i,
    /mailer-daemon@/i,
    /noreply@/i,
    /do-not-reply@/i,
    /support@.*\.com/i,
    /alerts@/i,
    /news@/i,
    /newsletter@/i
  ];

  private static BLOCKED_SUBJECT_PATTERNS = [
    /receipt/i,
    /order confirmation/i,
    /your statement/i,
    /newsletter/i,
    /unsubscribe/i,
    /invitation:/i,
    /calendar/i,
    /automated message/i,
    /out of office/i
  ];

  /**
   * Main filtering method - determines if we should reply to an email
   */
  async shouldReplyToEmail(
    message: EmailMessage, 
    userId: string, 
    userEmail: string
  ): Promise<FilterResult> {
    
    console.log(`🔍 Filtering email from ${message.from} with subject: "${message.subject}"`);

    // Get user's filter settings
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    if (!userSettings) {
      console.log(`⚠️ No user settings found for ${userId}, using defaults`);
      return { shouldReply: false, reason: 'No user settings found', category: 'blocked' };
    }

    // 1. Hard-coded filters (always applied)
    const hardCodedFilter = this.applyHardCodedFilters(message);
    if (!hardCodedFilter.shouldReply) {
      return hardCodedFilter;
    }

    // 2. Check if user is in To field (not just CC/BCC)
    const recipientCheck = this.checkRecipientFilter(message, userEmail);
    if (!recipientCheck.shouldReply) {
      return recipientCheck;
    }

    // 3. Safe reply hours removed - Ezra doesn't auto-reply, all replies need approval

    // 4. Apply user's blocklist
    const blocklistCheck = this.checkBlocklist(message.from, userSettings.blockedSenders);
    if (!blocklistCheck.shouldReply) {
      return blocklistCheck;
    }

    // 5. Apply user's allowlist (if sender is in allowlist, always reply)
    const allowlistCheck = this.checkAllowlist(message.from, userSettings.allowedSenders);
    if (allowlistCheck.shouldReply) {
      return allowlistCheck;
    }

    // 6. Apply reply scope settings (simplified - no unknown sender handling)
    const scopeCheck = await this.checkReplyScope(message, userId, userSettings);
    if (!scopeCheck.shouldReply) {
      return scopeCheck;
    }

    // If we get here, email passes all filters
    console.log(`✅ Email from ${message.from} passed all filters`);
    return { 
      shouldReply: true, 
      reason: 'Email passed all filters', 
      category: 'allowed' 
    };
  }

  /**
   * Apply hard-coded filters that are always ON
   */
  private applyHardCodedFilters(message: EmailMessage): FilterResult {
    // Check Gmail categories/labels
    if (message.labelIds) {
      for (const blockedLabel of EmailFilterService.ALWAYS_BLOCKED_LABELS) {
        if (message.labelIds.includes(blockedLabel)) {
          console.log(`🚫 Blocked by label: ${blockedLabel}`);
          return { 
            shouldReply: false, 
            reason: `Blocked by Gmail category: ${blockedLabel}`, 
            category: 'filtered' 
          };
        }
      }
    }

    // Check sender patterns
    for (const pattern of EmailFilterService.BLOCKED_SENDER_PATTERNS) {
      if (pattern.test(message.from)) {
        console.log(`🚫 Blocked by sender pattern: ${pattern}`);
        return { 
          shouldReply: false, 
          reason: `Blocked sender pattern: ${message.from}`, 
          category: 'filtered' 
        };
      }
    }

    // Check subject patterns
    for (const pattern of EmailFilterService.BLOCKED_SUBJECT_PATTERNS) {
      if (pattern.test(message.subject)) {
        console.log(`🚫 Blocked by subject pattern: ${pattern}`);
        return { 
          shouldReply: false, 
          reason: `Blocked subject pattern: ${message.subject}`, 
          category: 'filtered' 
        };
      }
    }

    // Check for empty/invalid senders
    if (!message.from || message.from.trim() === '' || !message.from.includes('@')) {
      console.log(`🚫 Blocked: Invalid sender`);
      return { 
        shouldReply: false, 
        reason: 'Invalid or empty sender', 
        category: 'filtered' 
      };
    }

    // Check for empty subjects (likely spam)
    if (!message.subject || message.subject.trim() === '') {
      console.log(`🚫 Blocked: Empty subject`);
      return { 
        shouldReply: false, 
        reason: 'Empty subject line', 
        category: 'filtered' 
      };
    }

    return { shouldReply: true, reason: 'Passed hard-coded filters', category: 'allowed' };
  }

  /**
   * Check if user is in the To field (not just CC/BCC)
   */
  private checkRecipientFilter(message: EmailMessage, userEmail: string): FilterResult {
    const toAddresses = message.to.map(addr => addr.toLowerCase());
    const userEmailLower = userEmail.toLowerCase();

    if (!toAddresses.includes(userEmailLower)) {
      console.log(`🚫 User not in To field, only in CC/BCC`);
      return { 
        shouldReply: false, 
        reason: 'User not directly addressed (CC/BCC only)', 
        category: 'filtered' 
      };
    }

    return { shouldReply: true, reason: 'User directly addressed', category: 'allowed' };
  }



  /**
   * Check if sender is in user's blocklist
   */
  private checkBlocklist(sender: string, blockedSenders: string[]): FilterResult {
    const senderLower = sender.toLowerCase();
    
    for (const blocked of blockedSenders) {
      const blockedLower = blocked.toLowerCase();
      
      // Check exact match or domain match
      if (senderLower === blockedLower || 
          senderLower.includes(blockedLower) || 
          (blockedLower.startsWith('@') && senderLower.endsWith(blockedLower))) {
        console.log(`🚫 Sender in blocklist: ${blocked}`);
        return { 
          shouldReply: false, 
          reason: `Sender in user blocklist: ${blocked}`, 
          category: 'blocked' 
        };
      }
    }

    return { shouldReply: true, reason: 'Sender not in blocklist', category: 'allowed' };
  }

  /**
   * Check if sender is in user's allowlist
   */
  private checkAllowlist(sender: string, allowedSenders: string[]): FilterResult {
    const senderLower = sender.toLowerCase();
    
    for (const allowed of allowedSenders) {
      const allowedLower = allowed.toLowerCase();
      
      // Check exact match or domain match
      if (senderLower === allowedLower || 
          senderLower.includes(allowedLower) || 
          (allowedLower.startsWith('@') && senderLower.endsWith(allowedLower))) {
        console.log(`✅ Sender in allowlist: ${allowed}`);
        return { 
          shouldReply: true, 
          reason: `Sender in user allowlist: ${allowed}`, 
          category: 'allowed' 
        };
      }
    }

    return { shouldReply: false, reason: 'Sender not in allowlist', category: 'filtered' };
  }

  /**
   * Check reply scope (contacts only vs all senders)
   */
  private async checkReplyScope(
    message: EmailMessage, 
    userId: string, 
    userSettings: any
  ): Promise<FilterResult> {
    
    if (userSettings.replyScope === 'ALL_SENDERS') {
      console.log(`✅ Reply scope allows all senders`);
      return { shouldReply: true, reason: 'Reply scope allows all senders', category: 'allowed' };
    }

    if (userSettings.replyScope === 'CONTACTS_ONLY') {
      // Check if sender has been communicated with before
      const hasHistory = await this.checkCommunicationHistory(message.from, userId);
      
      if (hasHistory) {
        console.log(`✅ Sender has communication history (contact)`);
        return { shouldReply: true, reason: 'Sender is a known contact', category: 'allowed' };
      } else {
        // Unknown sender - since Ezra doesn't auto-reply, all emails go to queue for approval
        console.log(`⏸️ Unknown sender, will show in queue for approval`);
        return { shouldReply: false, reason: 'Unknown sender, requires user approval', category: 'filtered' };
      }
    }

    return { shouldReply: false, reason: 'Unknown reply scope', category: 'filtered' };
  }

  /**
   * Check if we have communication history with this sender
   */
  private async checkCommunicationHistory(sender: string, userId: string): Promise<boolean> {
    const emailCount = await prisma.email.count({
      where: {
        thread: { userId },
        OR: [
          { from: sender },
          { to: { has: sender } }
        ]
      }
    });

    return emailCount > 0;
  }



  /**
   * Update user's filter settings
   */
  async updateFilterSettings(userId: string, settings: Partial<{
    replyScope: 'ALL_SENDERS' | 'CONTACTS_ONLY';
    blockedSenders: string[];
    allowedSenders: string[];
    enablePushNotifications: boolean;
  }>): Promise<any> {
    
    console.log(`⚙️ Updating filter settings for user ${userId}:`, settings);
    
    return await prisma.userSettings.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        ...settings
      }
    });
  }

  /**
   * Get user's current filter settings
   */
  async getFilterSettings(userId: string): Promise<any> {
    return await prisma.userSettings.findUnique({
      where: { userId }
    });
  }
} 