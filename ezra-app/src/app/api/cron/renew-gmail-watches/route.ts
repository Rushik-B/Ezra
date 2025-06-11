import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GmailPushService } from '@/lib/gmailPushService';

export async function GET(request: NextRequest) {
  // Security: Only allow requests with the correct cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('❌ Unauthorized cron request');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('🔄 Starting Gmail watch renewal for all users...');

  try {
    // Get all users with Google OAuth accounts
    const users = await prisma.user.findMany({
      include: {
        accounts: {
          where: {
            provider: 'google'
          }
        }
      },
      where: {
        accounts: {
          some: {
            provider: 'google',
            accessToken: {
              not: null
            }
          }
        }
      }
    });

    console.log(`📧 Found ${users.length} users with Gmail access`);

    const results = [];
    let successful = 0;
    let failed = 0;

    // Renew Gmail watch for each user
    for (const user of users) {
      const oauthAccount = user.accounts.find(account => account.provider === 'google');
      
      if (!oauthAccount || !oauthAccount.accessToken) {
        console.log(`⚠️ Skipping user ${user.id} - no valid access token`);
        failed++;
        continue;
      }

      try {
        console.log(`🔄 Renewing Gmail watch for user: ${user.id}`);
        
        const pushService = new GmailPushService(
          oauthAccount.accessToken,
          oauthAccount.refreshToken || undefined,
          user.id
        );

        // Setup push notifications with the Cloud Pub/Sub topic
        const topicName = `projects/ezra-461319/topics/ezra-email-updates`;
        
        const result = await pushService.setupPushNotifications(topicName);
        
        console.log(`✅ Renewed Gmail watch for user ${user.id} - historyId: ${result.historyId}, expiration: ${result.expiration}`);
        
        results.push({
          userId: user.id,
          email: user.email,
          success: true,
          historyId: result.historyId,
          expiration: result.expiration
        });
        
        successful++;
        
        // Add small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to renew Gmail watch for user ${user.id}:`, error);
        
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        failed++;
      }
    }

    const summary = {
      total: users.length,
      successful,
      failed,
      timestamp: new Date().toISOString()
    };

    console.log(`🏁 Gmail watch renewal completed:`, summary);

    return NextResponse.json({
      success: true,
      message: 'Gmail watch renewal completed',
      summary,
      results
    });

  } catch (error) {
    console.error('❌ Error during Gmail watch renewal:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}