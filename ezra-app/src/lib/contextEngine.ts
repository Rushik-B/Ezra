import { LLMService } from './llm';
import { CalendarService } from './calendarService';
import { prisma } from './prisma';
import { ContextualInformation, IncomingEmailScannerOutput } from '@/types/worker';
const parseMessyTime = require('parse-messy-time');

export interface IncomingEmailData {
  from: string;
  to: string[];
  subject: string;
  body: string;
  date: Date;
}

export class ContextEngineService {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  /**
   * Main orchestrator for contextual information gathering
   */
  async generateContextualInformation(
    userId: string, 
    incomingEmail: IncomingEmailData
  ): Promise<ContextualInformation> {
    console.log(`🧠 Starting contextual information gathering for user: ${userId}`);

    try {
      // Step 1: Analyze incoming email to determine what context is needed
      console.log('🔍 Step 1: Analyzing incoming email...');
      const scannerOutput = await this.llmService.invokeIncomingScanner(incomingEmail);

      // Step 2: Gather calendar information if needed
      let calendarData = undefined;
      if (scannerOutput.needsCalendarCheck) {
        console.log('📅 Step 2: Gathering calendar information...');
        calendarData = await this.gatherCalendarContext(userId, scannerOutput);
      } else {
        console.log('📅 Step 2: Skipping calendar - not needed');
      }

      // Step 3: Gather email context (two types)
      console.log('📧 Step 3: Gathering direct email history...');
      const directEmailHistory = await this.gatherDirectEmailHistory(userId, incomingEmail.from);
      
      console.log('🔍 Step 4: Gathering keyword-based email context...');
      const keywordEmailContext = await this.gatherKeywordEmailContext(userId, scannerOutput);

      // Step 5: Generate raw contextual information
      console.log('🔧 Step 5: Generating raw contextual information...');
      const calendarSummary = calendarData ? 
        this.generateCalendarSummary(calendarData) : 
        'No calendar information requested.';
      
      const directEmailSummary = this.generateDirectEmailSummary(directEmailHistory);
      const keywordEmailSummary = this.generateKeywordEmailSummary(keywordEmailContext);

      const rawContextualInfo = await this.llmService.invokeFinalToolContextGenerator(
        incomingEmail,
        scannerOutput,
        calendarSummary,
        directEmailSummary,
        keywordEmailSummary
      );

      // Step 6: Synthesize raw context into actionable reply instructions
      console.log('🧠 Step 6: Synthesizing context into reply instructions...');

      // NEW: Fetch POS modules
      const interactionNetwork = await prisma.interactionNetwork.findFirst({
        where: { userId, isActive: true },
        orderBy: { version: 'desc' },
      });
      const strategicRulebook = await prisma.strategicRulebook.findFirst({
        where: { userId, isActive: true },
        orderBy: { version: 'desc' },
      });

      console.log(`🤝 Interaction Network found: ${!!interactionNetwork}`);
      console.log(`📜 Strategic Rulebook found: ${!!strategicRulebook}`);

      const replyInstructions = await this.llmService.invokeContextSynthesizer(
        incomingEmail,
        rawContextualInfo,
        interactionNetwork?.content as object || {},
        strategicRulebook?.content as object || {},
      );


      const result: ContextualInformation = {
        calendarData,
        emailContext: {
          relevantEmails: [...directEmailHistory, ...keywordEmailContext],
          summary: `Direct emails: ${directEmailHistory.length}, Keyword matches: ${keywordEmailContext.length}`
        },
        scannerOutput,
        finalContext: {
          contextualDraft: replyInstructions,
          suggestedActions: [], // Actions will be extracted by reply generator from synthesized instructions
          confidenceScore: Math.round(Math.min(
            ((directEmailHistory.length * 10) + (keywordEmailContext.length * 5) + (calendarData ? 20 : 0)), 
            95
          )),
          reasoning: 'Context synthesized into actionable reply instructions',
          keyFactsUsed: [`${directEmailHistory.length} direct emails`, `${keywordEmailContext.length} keyword matches`, calendarData ? 'Calendar data included' : 'No calendar data'].filter(Boolean)
        }
      };

      //Uncomment to see the result of the context engine
      console.log("This is the result", result);

      console.log(`✅ Contextual information generated successfully`);
      console.log(`📊 Summary: Calendar=${!!calendarData}, Direct emails=${directEmailHistory.length}, Keyword emails=${keywordEmailContext.length}`);

      return result;

    } catch (error) {
      console.error('❌ Error in contextual information gathering:', error);
      
      // Return minimal fallback context
      return {
        emailContext: {
          relevantEmails: [],
          summary: 'Error gathering email context'
        },
        scannerOutput: {
          needsCalendarCheck: false,
          emailContextQuery: {
            keywords: [],
            senderFilter: [incomingEmail.from],
            dateWindowHint: 'recent',
            maxResults: 10
          },
          urgencyLevel: 'medium',
          primaryIntent: 'other',
          reasoning: 'Fallback due to context engine error'
        },
        finalContext: {
          contextualDraft: `Thank you for your email regarding "${incomingEmail.subject}". I'll review this and get back to you soon.`,
          suggestedActions: [],
          confidenceScore: 20,
          reasoning: 'Minimal fallback due to context engine error',
          keyFactsUsed: []
        }
      };
    }
  }

  /**
   * Gather calendar context based on scanner analysis
   */
  private async gatherCalendarContext(
    userId: string, 
    scannerOutput: IncomingEmailScannerOutput
  ): Promise<{
    availability: any;
    relevantEvents: any[];
    summary: string;
  } | undefined> {
    try {
      // Get user's OAuth token for calendar access
      const oauthAccount = await prisma.oAuthAccount.findFirst({
        where: {
          userId: userId,
          provider: 'google'
        }
      });

      if (!oauthAccount || !oauthAccount.accessToken) {
        console.log('⚠️ No calendar access token available');
        return undefined;
      }

      const calendarService = new CalendarService(
        oauthAccount.accessToken,
        oauthAccount.refreshToken || undefined,
        userId
      );

      // Parse date hints from scanner output
      const calendarParams = scannerOutput.calendarParameters;
      let relevantEvents: any[] = [];
      let availability: any = undefined;

      if (calendarParams?.dateHint) {
        // Try to parse the date hint and get relevant events
        const parsedDate = this.parseDateHint(calendarParams.dateHint);
        if (parsedDate) {
          console.log(`📅 Checking calendar for date: ${parsedDate.toISOString()}`);
          
          // Get events around the suggested time
          const startTime = new Date(parsedDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 1 week before
          const endTime = new Date(parsedDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 1 week after
          
          console.log(`📅 Fetching calendar events from ${startTime.toISOString()} to ${endTime.toISOString()}`);
          relevantEvents = await calendarService.getEvents(startTime, endTime);
          console.log(`📅 Found ${relevantEvents.length} calendar events`);
          
          // Check availability for the specific time if we can determine it
          if (calendarParams.durationHint) {
            const duration = this.parseDurationHint(calendarParams.durationHint);
            const endDateTime = new Date(parsedDate.getTime() + duration);
            availability = await calendarService.checkAvailability(parsedDate, endDateTime);
          }
        } else {
          console.log('⚠️ Could not parse date hint, getting general calendar context');
          relevantEvents = await calendarService.getWeekEvents();
          console.log(`📅 Found ${relevantEvents.length} calendar events`);
        }
      } else {
        // Get general context (this week's events) - always do this when calendar is needed
        console.log('📅 Getting general calendar context (this week)');
        relevantEvents = await calendarService.getWeekEvents();
        console.log(`📅 Found ${relevantEvents.length} calendar events`);
      }

      const summary = calendarService.generateCalendarSummary(relevantEvents, availability);

      return {
        availability,
        relevantEvents,
        summary
      };

    } catch (error) {
      console.error('❌ Error gathering calendar context:', error);
      return undefined;
    }
  }

  /**
   * Gather direct email history with the specific sender (chronological from recent to oldest)
   */
  private async gatherDirectEmailHistory(
    userId: string, 
    senderEmail: string
  ): Promise<any[]> {
    try {
      console.log(`📧 Fetching direct email history with ${senderEmail}...`);
      
      // Fetch emails between user and this specific sender from database
      const emails = await prisma.email.findMany({
        where: {
          thread: {
            userId
          },
          OR: [
            { from: senderEmail, isSent: false }, // Emails FROM the sender TO the user
            { to: { has: senderEmail }, isSent: true } // Emails FROM the user TO the sender
          ]
        },
        orderBy: {
          createdAt: 'desc' // Most recent first
        },
        take: 20, // Last 20 emails in this conversation
        select: {
          id: true,
          from: true,
          to: true,
          subject: true,
          body: true,
          createdAt: true,
          isSent: true,
          messageId: true
        }
      });

      console.log(`📧 Found ${emails.length} direct emails with ${senderEmail}`);
      
      return emails.map(email => ({
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
        date: email.createdAt,
        isSent: email.isSent,
        messageId: email.messageId
      }));

    } catch (error) {
      console.error('❌ Error gathering direct email history:', error);
      return [];
    }
  }

  /**
   * Gather keyword-based email context from all user's emails
   */
  private async gatherKeywordEmailContext(
    userId: string,
    scannerOutput: IncomingEmailScannerOutput
  ): Promise<any[]> {
    try {
      console.log(`🔍 Searching for keyword-based email context...`);
      
      const keywords = scannerOutput.emailContextQuery.keywords || [];
      const dateWindow = scannerOutput.emailContextQuery.dateWindowHint || 'recent';
      const maxResults = scannerOutput.emailContextQuery.maxResults || 15;

      if (keywords.length === 0) {
        console.log('⚠️ No keywords provided for email search');
        return [];
      }

      // Create date filter based on date window hint
      let dateFilter: any = {};
      const now = new Date();
      
      if (dateWindow === 'recent') {
        dateFilter = {
          createdAt: {
            gte: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)) // Last 30 days
          }
        };
      } else if (dateWindow === 'last_month') {
        dateFilter = {
          createdAt: {
            gte: new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000)) // Last 60 days
          }
        };
      }

      // Search for emails containing keywords in subject or body
      const emails = await prisma.email.findMany({
        where: {
          thread: {
            userId
          },
          ...dateFilter,
          OR: [
            {
              subject: {
                contains: keywords[0],
                mode: 'insensitive'
              }
            },
            {
              body: {
                contains: keywords[0],
                mode: 'insensitive'
              }
            }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: maxResults,
        select: {
          id: true,
          from: true,
          to: true,
          subject: true,
          body: true,
          createdAt: true,
          isSent: true,
          messageId: true
        }
      });

      console.log(`🔍 Found ${emails.length} keyword-matching emails`);
      
      return emails.map(email => ({
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
        date: email.createdAt,
        isSent: email.isSent,
        messageId: email.messageId,
        matchedKeywords: keywords.filter(keyword => 
          email.subject.toLowerCase().includes(keyword.toLowerCase()) ||
          email.body.toLowerCase().includes(keyword.toLowerCase())
        )
      }));

    } catch (error) {
      console.error('❌ Error gathering keyword email context:', error);
      return [];
    }
  }

  /**
   * Helper to parse date hints from natural language using parse-messy-time library
   */
  private parseDateHint(dateHint: string): Date | null {
    try {
      console.log(`📅 Attempting to parse date hint: "${dateHint}"`);
      
      // Use parse-messy-time library for better natural language parsing
      const parsedDate = parseMessyTime(dateHint);
      
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        console.log(`✅ Successfully parsed date: ${parsedDate.toISOString()}`);
        return parsedDate;
      }

      // Fallback to built-in Date parsing
      const fallbackDate = new Date(dateHint);
      if (!isNaN(fallbackDate.getTime())) {
        console.log(`✅ Fallback parsing successful: ${fallbackDate.toISOString()}`);
        return fallbackDate;
      }

      console.log(`⚠️ Could not parse date hint: "${dateHint}"`);
      return null;
    } catch (error) {
      console.error(`❌ Error parsing date hint "${dateHint}":`, error);
      return null;
    }
  }

  /**
   * Helper to parse duration hints
   */
  private parseDurationHint(durationHint: string): number {
    const lowerHint = durationHint.toLowerCase();
    
    // Extract numbers
    const numberMatch = lowerHint.match(/(\d+)/);
    const number = numberMatch ? parseInt(numberMatch[1]) : 60; // default 60 minutes
    
    if (lowerHint.includes('hour')) {
      return number * 60 * 60 * 1000; // hours to milliseconds
    } else {
      return number * 60 * 1000; // minutes to milliseconds
    }
  }

  /**
   * Generate calendar summary for LLM
   */
  private generateCalendarSummary(calendarData: any): string {
    // This would be handled by CalendarService.generateCalendarSummary
    // but we include it here for completeness
    return calendarData.summary || 'Calendar information available but no summary generated.';
  }

  /**
   * Generate direct email history summary for LLM (chronological from recent to oldest)
   */
  private generateDirectEmailSummary(emails: any[]): string {
    if (emails.length === 0) {
      return 'No direct communication history found with this sender.';
    }

    let summary = `DIRECT COMMUNICATION HISTORY (${emails.length} emails, most recent first):\n\n`;
    
    emails.forEach((email, index) => {
      const direction = email.isSent ? 'YOU SENT' : 'THEY SENT';
      const dateStr = email.date.toISOString().split('T')[0]; // YYYY-MM-DD format
      summary += `${index + 1}. ${direction} on ${dateStr} - "${email.subject}"\n`;
      summary += `   Content: ${email.body.substring(0, 200)}${email.body.length > 200 ? '...' : ''}\n\n`;
    });

    return summary;
  }

  /**
   * Generate keyword-based email context summary for LLM
   */
  private generateKeywordEmailSummary(emails: any[]): string {
    if (emails.length === 0) {
      return 'No keyword-matching emails found.';
    }

    let summary = `KEYWORD-BASED EMAIL CONTEXT (${emails.length} emails):\n\n`;
    
    emails.slice(0, 12).forEach((email, index) => { // Show up to 12 for broader context
      const direction = email.isSent ? 'YOU SENT' : 'RECEIVED FROM';
      const recipient = email.isSent ? email.to.join(', ') : email.from;
      const dateStr = email.date.toISOString().split('T')[0];
      const keywords = email.matchedKeywords ? ` [Keywords: ${email.matchedKeywords.join(', ')}]` : '';
      
      summary += `${index + 1}. ${direction} ${recipient} on ${dateStr} - "${email.subject}"${keywords}\n`;
      summary += `   Content: ${email.body.substring(0, 150)}${email.body.length > 150 ? '...' : ''}\n\n`;
    });

    if (emails.length > 12) {
      summary += `... and ${emails.length - 12} more keyword-matching emails\n`;
    }

    return summary;
  }

  /**
   * Generate email summary for LLM (legacy method - kept for compatibility)
   */
  private generateEmailSummary(emails: any[]): string {
    if (emails.length === 0) {
      return 'No relevant email history found.';
    }

    let summary = `RELEVANT EMAIL HISTORY (${emails.length} emails):\n\n`;
    
    emails.slice(0, 10).forEach((email, index) => { // Limit to top 10 for brevity
      const direction = email.isSent ? 'SENT' : 'RECEIVED';
      summary += `${index + 1}. ${direction} - "${email.subject}" (${email.date.toLocaleDateString()})\n`;
      summary += `   Snippet: ${email.snippet || email.body?.substring(0, 100)}\n\n`;
    });

    if (emails.length > 10) {
      summary += `... and ${emails.length - 10} more emails\n`;
    }

    return summary;
  }
} 