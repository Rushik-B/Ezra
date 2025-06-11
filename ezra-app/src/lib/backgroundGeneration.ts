import { prisma } from './prisma';
import { MasterPromptGeneratorService } from './masterPromptGenerator';

export class BackgroundGenerationService {
  private static runningGenerations = new Set<string>();

  /**
   * Start the staged generation process for a user
   */
  static async startStagedGeneration(userId: string): Promise<void> {
    // Prevent multiple generations for the same user
    if (this.runningGenerations.has(userId)) {
      console.log(`⚠️ Generation already running for user ${userId}`);
      return;
    }

    this.runningGenerations.add(userId);
    console.log(`🚀 Starting staged generation for user ${userId}`);

    try {
      await this.updateGenerationStatus(userId, 'GENERATING_MASTER', {
        step: 'master_prompt',
        message: 'Ezra is analyzing your communication style...'
      });

      // Step 1: Generate Master Prompt (if needed)
      const masterPromptService = new MasterPromptGeneratorService();
      
      const existingPrompt = await prisma.masterPrompt.findFirst({
        where: { userId, isActive: true, isGenerated: true }
      });

      if (!existingPrompt) {
        console.log(`📝 Generating Master Prompt for user ${userId}`);
        const canGenerate = await masterPromptService.canGenerateMasterPrompt(userId);
        
        if (canGenerate.canGenerate) {
          await masterPromptService.generateAndSaveMasterPrompt(userId);
          console.log(`✅ Master Prompt generated for user ${userId}`);
        } else {
          console.log(`⚠️ Not enough emails for Master Prompt generation: ${canGenerate.emailCount}/${canGenerate.minimumRequired}`);
        }
      }

      // Step 2: Generate Interaction Network (with delay and existence check)
      await this.updateGenerationStatus(userId, 'GENERATING_NETWORK', {
        step: 'interaction_network',
        message: 'Ezra is mapping your professional relationships...'
      });

      const existingNetwork = await prisma.interactionNetwork.findFirst({
        where: { userId, isActive: true }
      });

      if (!existingNetwork) {
        console.log(`⏳ Waiting 5 seconds before generating Interaction Network for user ${userId}...`);
        await this.delay(5000);
        console.log(`👥 Generating Interaction Network for user ${userId}`);
        await masterPromptService.generateAndSaveInteractionNetwork(userId);
        console.log(`✅ Interaction Network generated for user ${userId}`);
      } else {
        console.log(`✅ User ${userId} already has Interaction Network, skipping generation`);
      }

      // Step 3: Generate Strategic Rulebook (with delay and existence check)
      await this.updateGenerationStatus(userId, 'GENERATING_RULES', {
        step: 'strategic_rules',
        message: 'Ezra is learning your decision patterns...'
      });

      const existingRulebook = await prisma.strategicRulebook.findFirst({
        where: { userId, isActive: true }
      });

      if (!existingRulebook) {
        console.log(`⏳ Waiting 5 seconds before generating Strategic Rulebook for user ${userId}...`);
        await this.delay(5000);
        console.log(`📋 Generating Strategic Rulebook for user ${userId}`);
        await masterPromptService.generateAndSaveStrategicRulebook(userId);
        console.log(`✅ Strategic Rulebook generated for user ${userId}`);
      } else {
        console.log(`✅ User ${userId} already has Strategic Rulebook, skipping generation`);
      }

      // Mark as complete
      await this.updateGenerationStatus(userId, 'COMPLETE', {
        step: 'complete',
        message: 'Ezra has finished learning your style!'
      });

      console.log(`🎉 All generation complete for user ${userId}`);

    } catch (error) {
      console.error(`❌ Error during staged generation for user ${userId}:`, error);
      await this.updateGenerationStatus(userId, 'ERROR', {
        step: 'error',
        message: 'An error occurred during generation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.runningGenerations.delete(userId);
    }
  }

  /**
   * Update generation status in database
   */
  private static async updateGenerationStatus(
    userId: string, 
    status: 'GENERATING_MASTER' | 'GENERATING_NETWORK' | 'GENERATING_RULES' | 'COMPLETE' | 'ERROR',
    progress: any
  ): Promise<void> {
    await prisma.userSettings.upsert({
      where: { userId },
      update: {
        generationStatus: status,
        generationProgress: progress,
        updatedAt: new Date()
      },
      create: {
        userId,
        generationStatus: status,
        generationProgress: progress
      }
    });
  }

  /**
   * Get current generation status for a user
   */
  static async getGenerationStatus(userId: string) {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: {
        generationStatus: true,
        generationProgress: true,
        updatedAt: true
      }
    });

    return settings || {
      generationStatus: 'NONE',
      generationProgress: null,
      updatedAt: new Date()
    };
  }

  /**
   * Check if user needs generation
   */
  static async needsGeneration(userId: string): Promise<boolean> {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { generationStatus: true }
    });

    return !settings || settings.generationStatus === 'NONE' || settings.generationStatus === 'EMAILS_COMPLETE';
  }

  /**
   * Utility function for delays (still available if needed for rate limiting)
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 