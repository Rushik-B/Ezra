import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GmailPushService } from '@/lib/gmailPushService';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Setting up Gmail push notifications...');

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's OAuth token
    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: {
        userId: session.userId,
        provider: 'google'
      }
    });

    if (!oauthAccount || !oauthAccount.accessToken) {
      return NextResponse.json({ 
        error: 'No Gmail access token found. Please reconnect your Google account.' 
      }, { status: 400 });
    }

    // Create Gmail push service
    const pushService = new GmailPushService(
      oauthAccount.accessToken,
      oauthAccount.refreshToken || undefined,
      session.userId
    );

    // Setup push notifications with the Cloud Pub/Sub topic
    const topicName = `projects/ezra-461319/topics/ezra-email-updates`;
    
    const result = await pushService.setupPushNotifications(topicName);

    console.log(`✅ Gmail push notifications setup for user ${session.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Gmail push notifications setup successfully',
      historyId: result.historyId,
      expiration: result.expiration
    });

  } catch (error) {
    console.error('❌ Error setting up Gmail push notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to setup Gmail push notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 