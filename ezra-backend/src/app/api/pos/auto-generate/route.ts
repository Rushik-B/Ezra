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

    // Generate Interaction Network using dedicated endpoint
    console.log(`🤝 Triggering Interaction Network generation...`);
    try {
      const networkResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/pos/interaction-network/auto-generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify({ userId })
      });
      
      if (networkResponse.ok) {
        const networkResult = await networkResponse.json();
        if (networkResult.success) {
          interactionNetworkGenerated = true;
          console.log(`✅ Interaction Network generation completed`);
        }
      } else {
        console.log(`⚠️ Interaction Network generation failed, but continuing...`);
      }
    } catch (error) {
      console.log(`⚠️ Interaction Network generation error: ${error}, but continuing...`);
    }

    // Wait 5 seconds before generating Strategic Rulebook
    console.log('⏳ Waiting 5 seconds before generating Strategic Rulebook...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Generate Strategic Rulebook using dedicated endpoint
    console.log(`📜 Triggering Strategic Rulebook generation...`);
    try {
      const rulebookResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/pos/strategic-rulebook/auto-generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify({ userId })
      });
      
      if (rulebookResponse.ok) {
        const rulebookResult = await rulebookResponse.json();
        if (rulebookResult.success) {
          strategicRulebookGenerated = true;
          console.log(`✅ Strategic Rulebook generation completed`);
        }
      } else {
        console.log(`⚠️ Strategic Rulebook generation failed, but continuing...`);
      }
    } catch (error) {
      console.log(`⚠️ Strategic Rulebook generation error: ${error}, but continuing...`);
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