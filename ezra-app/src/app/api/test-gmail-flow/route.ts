import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GmailPushService } from '@/lib/gmailPushService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing complete Gmail push notification flow...');

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's OAuth token
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { accounts: true }
    });

    if (!user || !user.accounts.length) {
      return NextResponse.json({ 
        error: 'No OAuth accounts found' 
      }, { status: 400 });
    }

    const oauthAccount = user.accounts.find((account: any) => account.provider === 'google');
    if (!oauthAccount || !oauthAccount.accessToken) {
      return NextResponse.json({ 
        error: 'No Gmail access token found. Please reconnect your Google account.' 
      }, { status: 400 });
    }

    // Create Gmail push service with user credentials
    const pushService = new GmailPushService(
      oauthAccount.accessToken,
      oauthAccount.refreshToken || undefined,
      session.userId
    );

    // Simulate processing a push notification
    console.log('🧪 Simulating push notification processing...');
    await pushService.processPushNotification({
      emailAddress: user.email,
      historyId: Date.now().toString() // Use current timestamp as fake history ID
    });

    // Check if any emails were processed and replies generated
    const recentReplies = await prisma.generatedReply.findMany({
      where: {
        email: {
          thread: {
            userId: session.userId
          }
        }
      },
      include: {
        email: {
          include: {
            thread: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log(`🧪 Found ${recentReplies.length} recent generated replies`);

    // Get queue status
    const queueEmails = await prisma.email.findMany({
      where: {
        thread: {
          userId: session.userId
        },
        isSent: false,
        generatedReply: {
          isNot: null
        }
      },
      include: {
        generatedReply: true,
        thread: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`🧪 Found ${queueEmails.length} emails in queue`);

    return NextResponse.json({
      success: true,
      message: 'Gmail push notification flow test completed',
      results: {
        userEmail: user.email,
        hasGmailAccess: !!oauthAccount.accessToken,
        recentRepliesCount: recentReplies.length,
        queueEmailsCount: queueEmails.length,
        recentReplies: recentReplies.map(reply => ({
          emailId: reply.emailId,
          from: reply.email.from,
          subject: reply.email.subject,
          confidenceScore: reply.confidenceScore,
          createdAt: reply.createdAt
        })),
        queueEmails: queueEmails.map(email => ({
          id: email.id,
          from: email.from,
          subject: email.subject,
          hasReply: !!email.generatedReply,
          confidenceScore: email.generatedReply?.confidenceScore,
          createdAt: email.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('🧪 Error testing Gmail flow:', error);
    return NextResponse.json({ 
      error: 'Failed to test Gmail flow',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 