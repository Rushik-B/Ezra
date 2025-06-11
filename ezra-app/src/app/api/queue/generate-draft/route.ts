import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { replyGenerationQueue } from '@/lib/queues';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailId } = await request.json();

    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 });
    }

    console.log(`📧 Queuing draft reply generation for email: ${emailId}`);

    // Get the email
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { thread: true, generatedReply: true }
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Verify the email belongs to the current user
    if (email.thread.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized access to email' }, { status: 403 });
    }

    // Check if reply already exists
    if (email.generatedReply) {
      console.log(`✅ Draft reply already exists for email: ${emailId}`);
      return NextResponse.json({
        success: true,
        draft: {
          fullDraft: email.generatedReply.draft,
          draftPreview: email.generatedReply.draft.substring(0, 150) + (email.generatedReply.draft.length > 150 ? '...' : ''),
          confidence: email.generatedReply.confidenceScore,
          reasoning: 'Previously generated'
        }
      });
    }

    // Queue the reply generation job
    const job = await replyGenerationQueue.add('generate-reply', {
      emailId,
      userId: session.userId
    }, {
      delay: 0,
      removeOnComplete: 10,
      removeOnFail: 5,
    });

    console.log(`✅ Queued reply generation job ${job.id} for email: ${emailId}`);

    return NextResponse.json({
      success: true,
      message: 'Reply generation started in background',
      jobId: job.id
    }, { status: 202 });

  } catch (error) {
    console.error('❌ Error generating draft reply:', error);
    return NextResponse.json({ 
      error: 'Failed to generate draft reply',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 