import { prisma } from './prisma';
import { LLMService, EmailContext, ReplyGenerationResult } from './llm';
import { ContextEngineService } from './contextEngine';
import { getDefaultMasterPrompt, getStyleAnalysisPrompt } from './prompts';

export interface IncomingEmailData {
  from: string;
  to: string[];
  subject: string;
  body: string;
  date: Date;
}

export interface ReplyGenerationParams {
  userId: string;
  incomingEmail: IncomingEmailData;
}

export interface EnhancedReplyResult extends ReplyGenerationResult {
  contextualInfo?: {
    calendarUsed: boolean;
    emailsAnalyzed: number;
    suggestedActions: string[];
    contextConfidence: number;
  };
}

export class ReplyGeneratorService {
  private llmService: LLMService;
  private contextEngine: ContextEngineService;

  constructor() {
    this.llmService = new LLMService();
    this.contextEngine = new ContextEngineService();
  }

  /**
   * Rate limiting delay to prevent API overload
   */
  private async rateLimitDelay(ms: number = 0): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Enhanced main entry point - now with two-stage generation
   */
  async generateReply(params: ReplyGenerationParams): Promise<EnhancedReplyResult> {
    console.log(`🚀 Starting enhanced reply generation v4 for user: ${params.userId}`);
    
    try {
      // STAGE 1: Contextual Information Gathering
      console.log('🧠 STAGE 1: Gathering contextual information...');
      const contextualInfo = await this.contextEngine.generateContextualInformation(
        params.userId,
        params.incomingEmail
      );

      // STAGE 2: Style-aware Reply Generation
      console.log('🎨 STAGE 2: Generating styled reply...');
      
      // Get user's Master Prompt
      const masterPrompt = await this.getMasterPrompt(params.userId);
      console.log(`📝 Retrieved Master Prompt (length: ${masterPrompt.length})`);

      // Get email history with the specific sender for style analysis
      const emailHistory = await this.fetchEmailHistory(params.userId, params.incomingEmail.from);
      console.log(`📧 Found ${emailHistory.length} historical emails with sender for style analysis`);

      // Build email context for style analysis
      const emailContext: EmailContext = {
        incomingEmail: params.incomingEmail,
        historicalEmails: emailHistory
      };

      // Generate style context using the compression approach
      let styleContext = '';
      if (emailHistory.length >= 3) {
        // Step 1: Generate detailed style analysis
        console.log('🔍 Generating detailed style analysis...');
        const detailedStyleAnalysis = await this.generateEnhancedStyleSummary(emailHistory, masterPrompt);
        console.log(`📊 Generated detailed style analysis (length: ${detailedStyleAnalysis.length})`);
        
        // Step 2: Compress style analysis into efficient guide
        console.log('✂️ Compressing style analysis...');
        // Small delay between LLM calls to prevent rate limiting
        await this.rateLimitDelay(0);
        
        styleContext = await this.llmService.invokeStyleCompressor(
          masterPrompt,
          detailedStyleAnalysis,
          emailHistory
        );
        console.log(`🎯 Generated compressed style guide (length: ${styleContext.length})`);
      } else {
        // For limited history, generate basic style context directly
        styleContext = emailHistory.length > 0
          ? await this.llmService.generateStyleSummary(emailHistory)
          : "Limited communication history with this sender.";
        console.log(`📄 Generated basic style context (length: ${styleContext.length})`);
      }

      // Generate final reply using contextual draft + style
      const contextualDraft = contextualInfo.finalContext.contextualDraft;
      console.log(`🔧 Using contextual draft (length: ${contextualDraft.length}) for style refinement`);

      // Add delay to prevent rate limiting on free tier
      console.log('⏱️ Adding 0 second delay to prevent rate limiting...');
      await this.rateLimitDelay(0);

      const result = await this.llmService.generateReply(
        masterPrompt,
        emailContext,
        styleContext,
        contextualDraft
      );

      // Enhance result with contextual information
      const enhancedResult: EnhancedReplyResult = {
        ...result,
        contextualInfo: {
          calendarUsed: !!contextualInfo.calendarData,
          emailsAnalyzed: contextualInfo.emailContext.relevantEmails.length,
          suggestedActions: contextualInfo.finalContext.suggestedActions,
          contextConfidence: contextualInfo.finalContext.confidenceScore
        }
      };

      console.log(`✨ Enhanced reply generated with style confidence: ${result.confidence}%, context confidence: ${contextualInfo.finalContext.confidenceScore}%`);
      console.log(`📊 Context summary: Calendar=${!!contextualInfo.calendarData}, Emails=${contextualInfo.emailContext.relevantEmails.length}, Actions=${contextualInfo.finalContext.suggestedActions.length}`);

      // Log comprehensive token usage summary
      const tokenSummary = LLMService.getTokenSummary();
      console.log(`\n🔢 =================================`);
      console.log(`🔢 TOTAL TOKEN USAGE SUMMARY`);
      console.log(`🔢 =================================`);
      console.log(`🔢 Total Input Tokens:  ${tokenSummary.totalPromptTokens.toLocaleString()}`);
      console.log(`🔢 Total Output Tokens: ${tokenSummary.totalResponseTokens.toLocaleString()}`);
      console.log(`🔢 Total Tokens Used:   ${tokenSummary.totalTokens.toLocaleString()}`);
      console.log(`🔢 Number of LLM Calls: ${tokenSummary.calls.length}`);
      console.log(`🔢 =================================\n`);

      return enhancedResult;

    } catch (error) {
      console.error('❌ Error in enhanced reply generation:', error);
      
      // Fallback to traditional generation
      console.log('🔄 Falling back to traditional reply generation...');
      return await this.generateTraditionalReply(params);
    }
  }

  /**
   * Fallback to traditional reply generation when contextual generation fails
   */
  private async generateTraditionalReply(params: ReplyGenerationParams): Promise<EnhancedReplyResult> {
    try {
      console.log('📄 Generating traditional reply...');

      const masterPrompt = await this.getMasterPrompt(params.userId);
      const emailHistory = await this.fetchEmailHistory(params.userId, params.incomingEmail.from);

      const emailContext: EmailContext = {
        incomingEmail: params.incomingEmail,
        historicalEmails: emailHistory
      };

      const basicStyleContext = emailHistory.length > 0
        ? await this.llmService.generateStyleSummary(emailHistory)
        : "Limited communication history with this sender.";

      const result = await this.llmService.generateReply(
        masterPrompt,
        emailContext,
        basicStyleContext
        // No contextual draft - will use MODE B (traditional generation)
      );

      console.log(`📝 Traditional reply generated with confidence: ${result.confidence}%`);

      return {
        ...result,
        contextualInfo: {
          calendarUsed: false,
          emailsAnalyzed: emailHistory.length,
          suggestedActions: [],
          contextConfidence: 0
        }
      };

    } catch (error) {
      console.error('❌ Error in traditional reply generation:', error);
      return {
        reply: "I apologize, but I'm unable to generate a reply at this time. Please try again later.",
        confidence: 0,
        reasoning: `Error in reply generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        contextualInfo: {
          calendarUsed: false,
          emailsAnalyzed: 0,
          suggestedActions: [],
          contextConfidence: 0
        }
      };
    }
  }

  /**
   * Generate enhanced style summary that includes user's general style context
   */
  private async generateEnhancedStyleSummary(
    historicalEmails: EmailContext['historicalEmails'],
    userGeneralStyle: string
  ): Promise<string> {
    console.log('🔍 Generating enhanced style summary...');

    try {
      // Load enhanced style analysis prompt
      const styleAnalysisPrompt = getStyleAnalysisPrompt();
      
      // Format email history for analysis
      const emailHistoryText = historicalEmails
        .map((email, index) => `
          Email ${index + 1}:
          From: ${email.from}
          To: ${email.to.join(', ')}
          Subject: ${email.subject}
          Date: ${email.date.toISOString()}
          Body: ${email.body}
          Sent by user: ${email.isSent}
          ---
        `)
        .join('\n');

      // Create enhanced prompt with user's general style
      const enhancedPrompt = styleAnalysisPrompt
        .replace('{emailHistory}', emailHistoryText)
        .replace('{generalUserStyle}', userGeneralStyle);

      // Generate style analysis
      const styleAnalysis = await this.llmService.generateText(enhancedPrompt);
      
      console.log('✅ Enhanced style analysis completed');
      return styleAnalysis;

    } catch (error) {
      console.error('Error generating enhanced style summary:', error);
      
      // Fallback to basic style analysis
      console.log('🔄 Falling back to basic style analysis...');
      return await this.llmService.generateStyleSummary(historicalEmails);
    }
  }

  /**
   * Fetches the user's master prompt or returns default
   */
  private async getMasterPrompt(userId: string): Promise<string> {
    try {
      const masterPrompt = await prisma.masterPrompt.findFirst({
        where: {
          userId,
          isActive: true
        },
        orderBy: {
          version: 'desc'
        }
      });

      if (!masterPrompt) {
        return getDefaultMasterPrompt();
      }

      // If this is an AI-generated prompt with metadata, use the full Master Prompt
      if (masterPrompt.isGenerated && masterPrompt.metadata) {
        const metadata = masterPrompt.metadata as any;
        const fullMasterPrompt = metadata.fullMasterPrompt;
        const hasUserEdits = metadata.hasUserEdits;
        
        if (fullMasterPrompt) {
          console.log(`📝 Using full Master Prompt v${masterPrompt.version}${hasUserEdits ? ' (with user edits)' : ''}`);
          
          // Add priority instruction for USER_DIRECTIVE markers if user has made edits
          if (hasUserEdits) {
            return `${fullMasterPrompt}

**IMPORTANT PRIORITY INSTRUCTION:**
When generating replies, give HIGHEST PRIORITY to any instructions marked with "(USER_DIRECTIVE)" in the above Master Prompt. These represent explicit user preferences that override general patterns derived from email analysis. Always honor USER_DIRECTIVE instructions over other style guidance.`;
          }
          
          return fullMasterPrompt;
        }
      }

      // Fallback to the distilled prompt (what user sees in UI)
      return masterPrompt.prompt || getDefaultMasterPrompt();
    } catch (error) {
      console.error('Error fetching master prompt:', error);
      return getDefaultMasterPrompt();
    }
  }

  /**
   * Fetches email history of emails the user has sent TO the specified sender
   * This helps understand the user's communication style with this person
   */
  private async fetchEmailHistory(userId: string, senderEmail: string): Promise<EmailContext['historicalEmails']> {
    try {
      console.log(`🔍 Searching for emails sent TO ${senderEmail} by user ${userId}`);
      
      // First, let's check what emails exist for this user at all
      const allUserEmails = await prisma.email.count({
        where: {
          thread: {
            userId
          }
        }
      });
      console.log(`📊 Total emails in database for user: ${allUserEmails}`);
      
      // Check how many sent emails the user has
      const sentEmails = await prisma.email.count({
        where: {
          thread: {
            userId
          },
          isSent: true
        }
      });
      console.log(`📤 Total sent emails by user: ${sentEmails}`);
      
      // Check how many emails involve this sender (any direction)
      const emailsWithSender = await prisma.email.count({
        where: {
          thread: {
            userId
          },
          OR: [
            { from: senderEmail },
            { to: { has: senderEmail } }
          ]
        }
      });
      console.log(`📬 Total emails involving ${senderEmail}: ${emailsWithSender}`);
      
      // Now find emails that the user has SENT TO the sender
      const emails = await prisma.email.findMany({
        where: {
          thread: {
            userId
          },
          isSent: true, // Only emails sent by the user
          to: {
            has: senderEmail // Sent TO the sender
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 25, // Last 25 emails for better context
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

      console.log(`📧 Found ${emails.length} emails sent by user TO ${senderEmail}`);
      
      if (emails.length > 0) {
        console.log(`📅 Date range: ${emails[emails.length - 1].createdAt.toISOString()} to ${emails[0].createdAt.toISOString()}`);
      } else {
        console.log(`❓ Debug: Let's check what emails we have with this sender...`);
        
        // Debug: Show all emails involving this sender
        const debugEmails = await prisma.email.findMany({
          where: {
            thread: {
              userId
            },
            OR: [
              { from: senderEmail },
              { to: { has: senderEmail } }
            ]
          },
          select: {
            id: true,
            from: true,
            to: true,
            subject: true,
            isSent: true,
            createdAt: true
          },
          take: 5
        });
        
        console.log(`🐛 Debug emails with ${senderEmail}:`, debugEmails.map(e => ({
          id: e.id,
          from: e.from,
          to: e.to,
          isSent: e.isSent,
          subject: e.subject.substring(0, 50)
        })));
      }

      return emails.map(email => ({
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
        date: email.createdAt,
        isSent: email.isSent
      }));
    } catch (error) {
      console.error('Error fetching email history:', error);
      return [];
    }
  }

  /**
   * Helper method to create a default master prompt for a user
   */
  async createDefaultMasterPrompt(userId: string): Promise<void> {
    try {
      // Check if user already has a master prompt
      const existingPrompt = await prisma.masterPrompt.findFirst({
        where: { userId }
      });

      if (!existingPrompt) {
        await prisma.masterPrompt.create({
          data: {
            userId,
            prompt: getDefaultMasterPrompt(),
            version: 1,
            isActive: true
          }
        });
        console.log(`Created default master prompt for user ${userId}`);
      }
    } catch (error) {
      console.error('Error creating default master prompt:', error);
    }
  }
} 