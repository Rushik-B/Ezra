import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ReplyGeneratorService } from '@/lib/replyGenerator';

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

    console.log(`📧 Generating draft reply for email: ${emailId}`);

    // Get the email
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { thread: true }
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Verify the email belongs to the current user
    if (email.thread.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized access to email' }, { status: 403 });
    }

    // Generate the reply
    const replyGenerator = new ReplyGeneratorService();
    const replyResult = await replyGenerator.generateReply({
      userId: session.userId,
      incomingEmail: {
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
        date: email.createdAt
      }
    });

    console.log(`✅ Generated draft reply with confidence: ${replyResult.confidence}%`);

    return NextResponse.json({
      success: true,
      draft: {
        fullDraft: replyResult.reply,
        draftPreview: replyResult.reply.substring(0, 150) + (replyResult.reply.length > 150 ? '...' : ''),
        confidence: replyResult.confidence,
        reasoning: replyResult.reasoning
      }
    });

  } catch (error) {
    console.error('❌ Error generating draft reply:', error);
    return NextResponse.json({ 
      error: 'Failed to generate draft reply',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 