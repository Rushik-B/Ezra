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

    console.log(`🚀 Auto-generating POS components for user: ${userId}`);

    // Initialize the generator service
    const generator = new MasterPromptGeneratorService();

    let interactionNetworkGenerated = false;
    let strategicRulebookGenerated = false;

    // Generate Interaction Network
    try {
      console.log(`🤝 Checking if Interaction Network exists for user ${userId}...`);
      const existingNetwork = await prisma.interactionNetwork.findFirst({
        where: { userId, isActive: true }
      });

      if (!existingNetwork) {
        console.log(`📊 Generating Interaction Network for user ${userId}...`);
        await generator.generateAndSaveInteractionNetwork(userId);
        interactionNetworkGenerated = true;
        console.log(`✅ Interaction Network generated for user ${userId}`);
      } else {
        console.log(`✅ User ${userId} already has Interaction Network`);
      }
    } catch (error) {
      console.error(`❌ Error generating Interaction Network for user ${userId}:`, error);
      // Continue to Strategic Rulebook even if Interaction Network fails
    }

    // Wait 5 seconds before generating Strategic Rulebook
    console.log('⏳ Waiting 5 seconds before generating Strategic Rulebook...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Generate Strategic Rulebook
    try {
      console.log(`📜 Checking if Strategic Rulebook exists for user ${userId}...`);
      const existingRulebook = await prisma.strategicRulebook.findFirst({
        where: { userId, isActive: true }
      });

      if (!existingRulebook) {
        console.log(`📋 Generating Strategic Rulebook for user ${userId}...`);
        await generator.generateAndSaveStrategicRulebook(userId);
        strategicRulebookGenerated = true;
        console.log(`✅ Strategic Rulebook generated for user ${userId}`);
      } else {
        console.log(`✅ User ${userId} already has Strategic Rulebook`);
      }
    } catch (error) {
      console.error(`❌ Error generating Strategic Rulebook for user ${userId}:`, error);
    }

    const message = `POS generation complete for user ${userId}`;
    console.log(`🎉 ${message}`);

    return NextResponse.json({
      success: true,
      message,
      components: {
        interactionNetworkGenerated,
        strategicRulebookGenerated
      }
    });

  } catch (error) {
    console.error('❌ Error in pos/auto-generate API:', error);
    return NextResponse.json({ 
      error: 'Failed to auto-generate POS components',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 