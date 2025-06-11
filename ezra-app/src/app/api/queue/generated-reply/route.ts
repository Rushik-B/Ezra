import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');

    if (!emailId) {
      return NextResponse.json({ error: 'emailId parameter is required' }, { status: 400 });
    }

    // Get the email with generated reply
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { 
        thread: true, 
        generatedReply: true 
      }
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Verify the email belongs to the current user
    if (email.thread.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized access to email' }, { status: 403 });
    }

    if (!email.generatedReply) {
      return NextResponse.json({ 
        success: false,
        message: 'No generated reply found for this email' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      draft: {
        fullDraft: email.generatedReply.draft,
        draftPreview: email.generatedReply.draft.substring(0, 150) + (email.generatedReply.draft.length > 150 ? '...' : ''),
        confidence: email.generatedReply.confidenceScore,
        createdAt: email.generatedReply.createdAt
      }
    });

  } catch (error) {
    console.error('Error getting generated reply:', error);
    return NextResponse.json({ 
      error: 'Failed to get generated reply',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 