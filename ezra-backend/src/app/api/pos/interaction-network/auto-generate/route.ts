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

    console.log(`🚀 Auto-generating Interaction Network for user: ${userId}`);

    // Initialize the service
    const generatorService = new MasterPromptGeneratorService();

    // Check if user already has a real Interaction Network (not default)
    const existingNetwork = await prisma.interactionNetwork.findFirst({
      where: { userId },
      orderBy: { version: 'desc' }
    });

    // Check if existing network is a default (contains default notes)
    const isDefault = existingNetwork && 
      typeof existingNetwork.content === 'object' && 
      existingNetwork.content !== null &&
      'notes' in existingNetwork.content &&
      (existingNetwork.content as any).notes?.includes('Default network');

    if (existingNetwork && !isDefault) {
      console.log(`✅ User ${userId} already has real Interaction Network`);
      return NextResponse.json({ 
        success: true, 
        message: 'User already has generated Interaction Network',
        network: existingNetwork 
      });
    }

    // Generate real Interaction Network
    console.log(`🤝 Generating real Interaction Network for user ${userId}...`);
    const network = await generatorService.generateAndSaveInteractionNetwork(userId);

    console.log(`✅ Interaction Network generated for user ${userId}`);
    return NextResponse.json({ 
      success: true, 
      message: 'Interaction Network generated successfully',
      network 
    });

  } catch (error) {
    console.error('❌ Error auto-generating Interaction Network:', error);
    return NextResponse.json(
      { error: 'Failed to generate Interaction Network' },
      { status: 500 }
    );
  }
} 