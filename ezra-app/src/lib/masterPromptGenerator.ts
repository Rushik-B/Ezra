import { prisma } from './prisma';
import { LLMService } from './llm';
import { readPromptFile } from './prompts';

export interface GeneratedMasterPrompt {
  fullMasterPrompt: string;
  distilledMasterPrompt: string;
  emailsAnalyzed: number;
  generatedAt: Date;
  confidence: number;
}

export interface GeneratedInteractionNetwork {
  content: object;
  emailsAnalyzed: number;
  generatedAt: Date;
}

export interface GeneratedStrategicRulebook {
  content: object;
  emailsAnalyzed: number;
  generatedAt: Date;
}

export class MasterPromptGeneratorService {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  /**
   * Utility function for delays between LLM calls
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a personalized Master Prompt for a user based on their sent emails
   */
  async generateMasterPrompt(userId: string): Promise<GeneratedMasterPrompt> {
    try {
      console.log(`Starting Master Prompt generation for user: ${userId}`);

      // Fetch user's sent emails - use many more for better analysis
      const sentEmails = await this.fetchUserSentEmails(userId, 2000); // Increased to 2000 emails

      if (sentEmails.length === 0) {
        throw new Error('No sent emails found for Master Prompt generation');
      }

      console.log(`📧 Analyzing ${sentEmails.length} sent emails for Master Prompt generation`);

      // Format emails for analysis
      const emailCorpus = this.formatEmailsForAnalysis(sentEmails);

      // Generate full Master Prompt using LLM
      console.log('🧠 Generating full Master Prompt...');
      const fullMasterPrompt = await this.generateFullMasterPromptWithLLM(emailCorpus);

      // Generate distilled version for user display
      console.log('⏳ Waiting 5 seconds before generating distilled Master Prompt...');
      await this.delay(5000);
      console.log('🌀 Generating distilled Master Prompt...');
      const distilledMasterPrompt = await this.llmService.generateDistilledMasterPrompt(fullMasterPrompt);

      // Calculate confidence based on email count and content quality
      const confidence = this.calculateConfidence(sentEmails.length, emailCorpus);

      console.log(`✅ Master Prompt generated (confidence: ${confidence}%)`)

      return {
        fullMasterPrompt,
        distilledMasterPrompt,
        emailsAnalyzed: sentEmails.length,
        generatedAt: new Date(),
        confidence
      };

    } catch (error) {
      console.error('Error generating Master Prompt:', error);
      throw new Error(`Failed to generate Master Prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * NEW: Generate a personalized Interaction Network for a user
   */
  async generateInteractionNetwork(userId: string): Promise<GeneratedInteractionNetwork> {
    try {
      console.log(`Starting Interaction Network generation for user: ${userId}`);
      const sentEmails = await this.fetchUserSentEmails(userId, 500);
      if (sentEmails.length === 0) {
        throw new Error('No sent emails found for Interaction Network generation');
      }
      console.log(`🤝 Analyzing ${sentEmails.length} sent emails for Interaction Network`);
      const emailCorpus = this.formatEmailsForAnalysis(sentEmails);

      console.log('🧠 Generating Interaction Network...');
      const promptTemplate = readPromptFile('interactionNetworkGeneratorPrompt.md');
      const prompt = promptTemplate.replace('{userSentEmailCorpus}', emailCorpus);
      const response = await this.llmService.generateText(prompt);
      const content = JSON.parse(response.replace(/```json\n?|\n?```/g, '').trim());
      
      console.log('✅ Interaction Network generated');

      return {
        content,
        emailsAnalyzed: sentEmails.length,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating Interaction Network:', error);
      throw new Error(`Failed to generate Interaction Network: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * NEW: Generate a personalized Strategic Rulebook for a user
   */
  async generateStrategicRulebook(userId: string): Promise<GeneratedStrategicRulebook> {
    try {
      console.log(`Starting Strategic Rulebook generation for user: ${userId}`);
      const sentEmails = await this.fetchUserSentEmails(userId, 500);
      if (sentEmails.length === 0) {
        throw new Error('No sent emails found for Strategic Rulebook generation');
      }
      console.log(`📜 Analyzing ${sentEmails.length} sent emails for Strategic Rulebook`);
      const emailCorpus = this.formatEmailsForAnalysis(sentEmails);

      console.log('🧠 Generating Strategic Rulebook...');
      const promptTemplate = readPromptFile('strategicRulebookGeneratorPrompt.md');
      const prompt = promptTemplate.replace('{userSentEmailCorpus}', emailCorpus);
      const response = await this.llmService.generateText(prompt);
      const content = JSON.parse(response.replace(/```json\n?|\n?```/g, '').trim());

      console.log('✅ Strategic Rulebook generated');

      return {
        content,
        emailsAnalyzed: sentEmails.length,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating Strategic Rulebook:', error);
      throw new Error(`Failed to generate Strategic Rulebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate and save Master Prompt for a user, deactivating previous ones
   */
  async generateAndSaveMasterPrompt(userId: string): Promise<{ id: string; version: number; confidence: number }> {
    try {
      // Generate the Master Prompt
      const generated = await this.generateMasterPrompt(userId);

      // Get current highest version
      const currentPrompt = await prisma.masterPrompt.findFirst({
        where: { userId },
        orderBy: { version: 'desc' }
      });

      const nextVersion = currentPrompt ? currentPrompt.version + 1 : 1;

      // Deactivate all existing prompts
      await prisma.masterPrompt.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      // Save new Master Prompt with both full and distilled versions
      const savedPrompt = await prisma.masterPrompt.create({
        data: {
          userId,
          prompt: generated.distilledMasterPrompt, // User sees distilled version
          version: nextVersion,
          isActive: true,
          isGenerated: true,
          metadata: {
            fullMasterPrompt: generated.fullMasterPrompt, // Full version stored in metadata
            originalDistilledPrompt: generated.distilledMasterPrompt, // Keep original for comparison
            emailsAnalyzed: generated.emailsAnalyzed,
            generatedAt: generated.generatedAt.toISOString(),
            confidence: generated.confidence
          }
        }
      });

      console.log(`✅ Master Prompt v${nextVersion} saved for user ${userId}`);

      // ALSO GENERATE AND SAVE THE OTHER POS COMPONENTS WITH DELAYS
      console.log(`⏳ Waiting 5 seconds before generating Interaction Network...`);
      await this.delay(5000);
      await this.generateAndSaveInteractionNetwork(userId);
      
      console.log(`⏳ Waiting 5 seconds before generating Strategic Rulebook...`);
      await this.delay(5000);
      await this.generateAndSaveStrategicRulebook(userId);

      return {
        id: savedPrompt.id,
        version: savedPrompt.version,
        confidence: generated.confidence
      };

    } catch (error) {
      console.error('Error generating and saving Master Prompt:', error);
      throw error;
    }
  }

  /**
   * NEW: Generate and save Interaction Network
   */
  async generateAndSaveInteractionNetwork(userId: string): Promise<any> {
    try {
      const network = await this.generateInteractionNetwork(userId);
      const current = await prisma.interactionNetwork.findFirst({
        where: { userId },
        orderBy: { version: 'desc' }
      });
      const nextVersion = current ? current.version + 1 : 1;

      await prisma.interactionNetwork.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      const saved = await prisma.interactionNetwork.create({
        data: {
          userId,
          content: network.content,
          version: nextVersion,
          isActive: true,
        }
      });
      console.log(`✅ Interaction Network v${nextVersion} saved for user ${userId}`);
      return saved;
    } catch (error) {
      console.error('Error generating and saving Interaction Network:', error);
      throw error;
    }
  }

  /**
   * NEW: Generate and save Strategic Rulebook
   */
  async generateAndSaveStrategicRulebook(userId: string): Promise<any> {
    try {
      const rulebook = await this.generateStrategicRulebook(userId);
      const current = await prisma.strategicRulebook.findFirst({
        where: { userId },
        orderBy: { version: 'desc' }
      });
      const nextVersion = current ? current.version + 1 : 1;

      await prisma.strategicRulebook.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      const saved = await prisma.strategicRulebook.create({
        data: {
          userId,
          content: rulebook.content,
          version: nextVersion,
          isActive: true,
        }
      });
      console.log(`✅ Strategic Rulebook v${nextVersion} saved for user ${userId}`);
      return saved;
    } catch (error) {
      console.error('Error generating and saving Strategic Rulebook:', error);
      throw error;
    }
  }

  /**
   * Update Master Prompt based on user edits to distilled version
   */
  async updateMasterPromptFromDistilled(
    userId: string, 
    promptId: string, 
    userEditedDistilledPrompt: string
  ): Promise<{ id: string; version: number }> {
    try {
      console.log(`Updating Master Prompt from distilled edits for user: ${userId}`);

      // Get the current prompt
      const currentPrompt = await prisma.masterPrompt.findFirst({
        where: { id: promptId, userId }
      });

      if (!currentPrompt || !currentPrompt.metadata) {
        throw new Error('Master Prompt not found or missing metadata');
      }

      const metadata = currentPrompt.metadata as any;
      const originalFullMasterPrompt = metadata.fullMasterPrompt;
      const originalDistilledPrompt = metadata.originalDistilledPrompt;

      if (!originalFullMasterPrompt || !originalDistilledPrompt) {
        throw new Error('Missing original prompts in metadata');
      }

      // Use LLM to update the full Master Prompt based on user edits
      console.log('🔄 Translating distilled edits to full Master Prompt...');
      const updatedFullMasterPrompt = await this.llmService.updateFullMasterPrompt(
        originalFullMasterPrompt,
        originalDistilledPrompt,
        userEditedDistilledPrompt
      );

      // Get next version number
      const nextVersion = currentPrompt.version + 1;

      // Deactivate current prompt
      await prisma.masterPrompt.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      // Create new version with updated prompts
      const updatedPrompt = await prisma.masterPrompt.create({
        data: {
          userId,
          prompt: userEditedDistilledPrompt, // User's edited distilled version
          version: nextVersion,
          isActive: true,
          isGenerated: true,
          metadata: {
            fullMasterPrompt: updatedFullMasterPrompt, // Updated full version with USER_DIRECTIVE marks
            originalDistilledPrompt: originalDistilledPrompt, // Keep original for reference
            emailsAnalyzed: metadata.emailsAnalyzed,
            generatedAt: metadata.generatedAt,
            confidence: metadata.confidence,
            lastEditedAt: new Date().toISOString(),
            hasUserEdits: true
          }
        }
      });

      console.log(`✅ Master Prompt updated to v${nextVersion} with user edits`);

      return {
        id: updatedPrompt.id,
        version: updatedPrompt.version
      };

    } catch (error) {
      console.error('Error updating Master Prompt from distilled edits:', error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient emails for Master Prompt generation
   */
  async canGenerateMasterPrompt(userId: string): Promise<{ canGenerate: boolean; emailCount: number; minimumRequired: number }> {
    const minimumRequired = 5; // Lowered requirement as requested
    
    const emailCount = await prisma.email.count({
      where: {
        thread: { userId },
        isSent: true
      }
    });

    return {
      canGenerate: emailCount >= minimumRequired,
      emailCount,
      minimumRequired
    };
  }

  /**
   * Check if user has a master prompt, if not generate one automatically
   */
  async ensureUserHasMasterPrompt(userId: string): Promise<boolean> {
    try {
      // Check if user already has an active master prompt
      const existingPrompt = await prisma.masterPrompt.findFirst({
        where: {
          userId,
          isActive: true
        }
      });

      if (existingPrompt) {
        console.log(`✅ User ${userId} already has master prompt v${existingPrompt.version}`);
        // Also check for the other components with delays
        await this.ensureUserHasInteractionNetwork(userId);
        console.log(`⏳ Waiting 5 seconds before checking Strategic Rulebook...`);
        await this.delay(5000);
        await this.ensureUserHasStrategicRulebook(userId);
        return true;
      }

      // Check if user has enough emails
      const canGenerate = await this.canGenerateMasterPrompt(userId);
      
      if (!canGenerate.canGenerate) {
        console.log(`⚠️ User ${userId} needs ${canGenerate.minimumRequired - canGenerate.emailCount} more emails for master prompt generation`);
        return false;
      }

      // Generate master prompt automatically
      console.log(`🚀 Auto-generating master prompt for user ${userId} with ${canGenerate.emailCount} emails`);
      
      await this.generateAndSaveMasterPrompt(userId);
      
      console.log(`✅ Successfully auto-generated master prompt for user ${userId}`);
      return true;

    } catch (error) {
      console.error(`❌ Error ensuring master prompt for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * NEW: Check for and generate Interaction Network if missing
   */
  async ensureUserHasInteractionNetwork(userId: string): Promise<boolean> {
    const existing = await prisma.interactionNetwork.findFirst({ where: { userId, isActive: true }});
    if (existing) return true;
    
    console.log(`🤝 Interaction Network missing for user ${userId}, generating...`);
    try {
      await this.generateAndSaveInteractionNetwork(userId);
      return true;
    } catch(e) {
      console.error(`❌ Error ensuring Interaction Network for user ${userId}:`, e);
      return false;
    }
  }

  /**
   * NEW: Check for and generate Strategic Rulebook if missing
   */
  async ensureUserHasStrategicRulebook(userId: string): Promise<boolean> {
    const existing = await prisma.strategicRulebook.findFirst({ where: { userId, isActive: true }});
    if (existing) return true;

    console.log(`📜 Strategic Rulebook missing for user ${userId}, generating...`);
    try {
      await this.generateAndSaveStrategicRulebook(userId);
      return true;
    } catch(e) {
      console.error(`❌ Error ensuring Strategic Rulebook for user ${userId}:`, e);
      return false;
    }
  }

  /**
   * Fetch user's sent emails for analysis - using large limit for 1M context window
   */
  private async fetchUserSentEmails(userId: string, limit: number = 1000) {
    const emails = await prisma.email.findMany({
      where: {
        thread: { userId },
        isSent: true,
        // Exclude very short emails (likely auto-replies or brief responses)
        body: {
          not: {
            in: ['', 'Thanks', 'Thank you', 'Got it', 'Ok', 'Okay', 'Yes', 'No']
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        thread: true
      }
    });

    return emails.filter(email => 
      email.body.length > 20 && // Filter out very short emails
      !this.isAutoReply(email.body) // Filter out auto-replies
    );
  }

  /**
   * Format emails into the corpus format expected by the LLM
   */
  private formatEmailsForAnalysis(emails: any[]): string {
    return emails.map(email => {
      const toList = Array.isArray(email.to) ? email.to.join(', ') : email.to;
      
      return `--- EMAIL START ---
From: ${email.from}
To: ${toList}
Subject: ${email.subject}
Date: ${email.createdAt.toISOString()}

${email.body}
--- EMAIL END ---`;
    }).join('\n\n');
  }

  /**
   * Generate Master Prompt using LLM service
   */
  private async generateFullMasterPromptWithLLM(emailCorpus: string): Promise<string> {
    try {
      // Load the Master Style Derivation prompt
      const promptTemplate = readPromptFile('masterStyleDerivationPrompt.md');
      
      // Replace placeholder with actual email corpus
      const prompt = promptTemplate.replace('{userSentEmailCorpus}', emailCorpus);

      console.log('Sending email corpus to LLM for Master Prompt generation...');
      
      // Generate the Master Prompt
      const response = await this.llmService.generateText(prompt);

      // Extract the markdown block if present
      const markdownMatch = response.match(/```markdown\n([\s\S]*?)\n```/);
      if (markdownMatch) {
        return markdownMatch[1].trim();
      }

      // If no markdown block, return the full response
      return response.trim();

    } catch (error) {
      console.error('Error generating Master Prompt with LLM:', error);
      throw new Error('Failed to generate Master Prompt with LLM');
    }
  }

  /**
   * Calculate confidence score based on email quantity and quality
   */
  private calculateConfidence(emailCount: number, emailCorpus: string): number {
    let confidence = 0;

    // Base confidence from email count (0-60 points) - adjusted for lower requirements
    if (emailCount >= 50) confidence += 60;
    else if (emailCount >= 25) confidence += 50;
    else if (emailCount >= 15) confidence += 40;
    else if (emailCount >= 10) confidence += 35;
    else if (emailCount >= 5) confidence += 25; // Lower threshold
    else confidence += 15;

    // Additional confidence from corpus quality (0-40 points)
    const averageEmailLength = emailCorpus.length / emailCount;
    if (averageEmailLength >= 500) confidence += 40;
    else if (averageEmailLength >= 300) confidence += 30;
    else if (averageEmailLength >= 150) confidence += 20;
    else confidence += 10;

    return Math.min(confidence, 100);
  }

  /**
   * Simple heuristic to detect auto-replies
   */
  private isAutoReply(body: string): boolean {
    const autoReplyIndicators = [
      'out of office',
      'automatic reply',
      'auto-reply',
      'vacation response',
      'currently away',
      'will respond when',
      'thank you for your email'
    ];

    const lowerBody = body.toLowerCase();
    return autoReplyIndicators.some(indicator => lowerBody.includes(indicator));
  }
} 