import { NextRequest, NextResponse } from 'next/server';
import { MasterPromptGeneratorService } from '@/lib/masterPromptGenerator';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    // Simple auth check
    const authHeader = request.headers.get('authorization');
    const tokenUserId = authHeader?.replace('Bearer ', '');
    
    if (!userId || (tokenUserId && tokenUserId !== userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🚀 Auto-generating Strategic Rulebook for user: ${userId}`);

    // Initialize the service
    const generatorService = new MasterPromptGeneratorService();

    // Check if user already has a real Strategic Rulebook (not default)
    const existingRulebook = await prisma.strategicRulebook.findFirst({
      where: { userId },
      orderBy: { version: 'desc' }
    });

    // Check if existing rulebook is a default (contains default notes)
    const isDefault = existingRulebook && 
      typeof existingRulebook.content === 'object' && 
      existingRulebook.content !== null &&
      'notes' in existingRulebook.content &&
      (existingRulebook.content as any).notes?.includes('Default rulebook');

    if (existingRulebook && !isDefault) {
      console.log(`✅ User ${userId} already has real Strategic Rulebook`);
      return NextResponse.json({ 
        success: true, 
        message: 'User already has generated Strategic Rulebook',
        rulebook: existingRulebook 
      });
    }

    // Generate real Strategic Rulebook
    console.log(`📜 Generating real Strategic Rulebook for user ${userId}...`);
    const rulebook = await generatorService.generateAndSaveStrategicRulebook(userId);

    console.log(`✅ Strategic Rulebook generated for user ${userId}`);
    return NextResponse.json({ 
      success: true, 
      message: 'Strategic Rulebook generated successfully',
      rulebook 
    });

  } catch (error) {
    console.error('❌ Error auto-generating Strategic Rulebook:', error);
    return NextResponse.json(
      { error: 'Failed to generate Strategic Rulebook' },
      { status: 500 }
    );
  }
} 