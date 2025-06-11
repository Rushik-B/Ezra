import { NextRequest, NextResponse } from 'next/server';
import { posGenerationQueue } from '@/lib/queues';
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

    console.log(`🚀 Queuing POS components generation for user: ${userId}`);

    // Queue the POS generation job
    const job = await posGenerationQueue.add('generate-pos-components', { userId }, {
      delay: 0,
      removeOnComplete: 3,
      removeOnFail: 2,
    });

    console.log(`✅ Queued POS generation job ${job.id} for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'POS generation started in background',
      jobId: job.id
    }, { status: 202 });

  } catch (error) {
    console.error('❌ Error queuing POS generation:', error);
    return NextResponse.json({ 
      error: 'Failed to queue POS generation',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 