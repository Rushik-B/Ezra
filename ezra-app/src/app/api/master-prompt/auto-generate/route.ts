import { NextRequest, NextResponse } from 'next/server';
import { masterPromptQueue } from '@/lib/queues';
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

    console.log(`🚀 Queuing Master Prompt generation for user: ${userId}`);

    // Check if user already has an AI-generated Master Prompt
    const existingGeneratedPrompt = await prisma.masterPrompt.findFirst({
      where: {
        userId: userId,
        isGenerated: true
      }
    });

    if (existingGeneratedPrompt) {
      console.log('✅ User already has an AI-generated Master Prompt');
      return NextResponse.json({
        success: true,
        message: 'Master Prompt already exists',
        skipped: true
      });
    }

    // Queue the master prompt generation job
    const job = await masterPromptQueue.add('generate-master-prompt', { userId }, {
      delay: 0,
      removeOnComplete: 3,
      removeOnFail: 2,
    });

    console.log(`✅ Queued master prompt generation job ${job.id} for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Master Prompt generation started in background',
      jobId: job.id
    }, { status: 202 });

  } catch (error) {
    console.error('❌ Error queuing Master Prompt generation:', error);
    return NextResponse.json({ 
      error: 'Failed to queue Master Prompt generation',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 