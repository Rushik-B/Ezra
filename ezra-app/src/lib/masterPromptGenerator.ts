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

export class MasterPromptGeneratorService {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  /**
   * Generate a personalized Master Prompt for a user based on their sent emails
   */
  async generateMasterPrompt(userId: string): Promise<GeneratedMasterPrompt> {
    try {
      console.log(`Starting Master Prompt generation for user: ${userId}`);

      // Fetch user's sent emails
      const sentEmails = await this.fetchUserSentEmails(userId);

      if (sentEmails.length === 0) {
        throw new Error('No sent emails found for Master Prompt generation');
      }

      console.log(`Found ${sentEmails.length} sent emails for analysis`);

      // Format emails for analysis
      const emailCorpus = this.formatEmailsForAnalysis(sentEmails);

      // Generate full Master Prompt using LLM
      console.log('🧠 Generating full Master Prompt...');
      const fullMasterPrompt = await this.generateFullMasterPromptWithLLM(emailCorpus);

      // Generate distilled version for user display
      console.log('🌀 Generating distilled Master Prompt...');
      const distilledMasterPrompt = await this.llmService.generateDistilledMasterPrompt(fullMasterPrompt);

      // Calculate confidence based on email count and content quality
      const confidence = this.calculateConfidence(sentEmails.length, emailCorpus);

      console.log(`Master Prompt generated with confidence: ${confidence}%`);

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

      console.log(`Saved generated Master Prompt v${nextVersion} for user ${userId}`);

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

      console.log(`Updated Master Prompt to v${nextVersion} with user edits`);

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
   * Fetch user's sent emails for analysis
   */
  private async fetchUserSentEmails(userId: string, limit: number = 200) {
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