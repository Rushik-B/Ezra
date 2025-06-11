import { NextRequest, NextResponse } from 'next/server';
import { MasterPromptGeneratorService } from '@/lib/masterPromptGenerator';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get userId from request body or Authorization header
    const body = await request.json();
    const { userId } = body;
    
    // Simple auth check
    const authHeader = request.headers.get('authorization');
    const tokenUserId = authHeader?.replace('Bearer ', '');
    
    if (!userId || (tokenUserId && tokenUserId !== userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🚀 Auto-generating Master Prompt for user: ${userId}`);

    // Check if user already has an AI-generated Master Prompt
    const existingGeneratedPrompt = await prisma.masterPrompt.findFirst({
      where: {
        userId: userId,
        isGenerated: true
      }
    });

    if (existingGeneratedPrompt) {
      console.log('✅ User already has an AI-generated Master Prompt, skipping to POS generation');
      
      // Skip to POS generation
      try {
        fetch(`${process.env.NEXTAUTH_URL || 'https://ezra-frontend.vercel.app'}/api/pos/auto-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userId}`
          },
          body: JSON.stringify({ userId })
        }).catch(error => {
          console.error('❌ Error triggering POS generation:', error);
        });
      } catch (error) {
        console.error('❌ Error triggering POS generation:', error);
      }

      return NextResponse.json({
        success: true,
        message: 'Master Prompt already exists, POS generation triggered',
        skipped: true
      });
    }

    // Initialize the generator service
    const generator = new MasterPromptGeneratorService();

    // Check if user has enough emails
    const eligibility = await generator.canGenerateMasterPrompt(userId);
    
    if (!eligibility.canGenerate) {
      console.log(`📧 User has ${eligibility.emailCount}/${eligibility.minimumRequired} emails needed for Master Prompt generation`);
      return NextResponse.json({
        success: false,
        message: `Insufficient email data: ${eligibility.emailCount}/${eligibility.minimumRequired} emails`,
        emailCount: eligibility.emailCount,
        minimumRequired: eligibility.minimumRequired
      });
    }

    console.log(`✨ Generating Master Prompt for user ${userId} with ${eligibility.emailCount} emails...`);

    // Generate ONLY the Master Prompt (without the POS components)
    const generated = await generator.generateMasterPrompt(userId);

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

    // Save new Master Prompt
    const savedPrompt = await prisma.masterPrompt.create({
      data: {
        userId,
        prompt: generated.distilledMasterPrompt,
        version: nextVersion,
        isActive: true,
        isGenerated: true,
        metadata: {
          fullMasterPrompt: generated.fullMasterPrompt,
          originalDistilledPrompt: generated.distilledMasterPrompt,
          emailsAnalyzed: generated.emailsAnalyzed,
          generatedAt: generated.generatedAt.toISOString(),
          confidence: generated.confidence
        }
      }
    });

    console.log(`🎉 Master Prompt v${nextVersion} generated with ${generated.confidence}% confidence`);

    // Wait 5 seconds before triggering POS generation
    setTimeout(() => {
      try {
        console.log('🚀 Triggering POS generation in separate function...');
        fetch(`${process.env.NEXTAUTH_URL || 'https://ezra-frontend.vercel.app'}/api/pos/auto-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userId}`
          },
          body: JSON.stringify({ userId })
        }).catch(error => {
          console.error('❌ Error triggering POS generation:', error);
        });
      } catch (error) {
        console.error('❌ Error triggering POS generation:', error);
      }
    }, 5000);

    console.log(`✅ Master Prompt generation complete for user ${userId}`);

    return NextResponse.json({
      success: true,
      id: savedPrompt.id,
      version: savedPrompt.version,
      confidence: generated.confidence,
      message: `Master Prompt v${nextVersion} generated successfully with ${generated.confidence}% confidence - POS generation will start in 5 seconds`
    });

  } catch (error) {
    console.error('❌ Error in master-prompt/auto-generate API:', error);
    return NextResponse.json({ 
      error: 'Failed to auto-generate Master Prompt',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 