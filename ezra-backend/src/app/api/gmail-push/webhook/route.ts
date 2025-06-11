import { NextRequest, NextResponse } from 'next/server';
import { GmailPushService } from '@/lib/gmailPushService';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Received Gmail push notification webhook');

    const body = await request.json();
    
    // Extract Pub/Sub message
    const pubsubMessage = body.message;
    if (!pubsubMessage || !pubsubMessage.data) {
      console.log('⚠️ No message data in webhook payload');
      return NextResponse.json({ success: true }); // Acknowledge anyway
    }

    // Decode the base64 message data
    const messageData = Buffer.from(pubsubMessage.data, 'base64').toString('utf-8');
    const notification = JSON.parse(messageData);

    console.log('📧 Decoded notification:', notification);

    // Extract email address and history ID
    const { emailAddress, historyId } = notification;
    
    if (!emailAddress || !historyId) {
      console.log('⚠️ Missing emailAddress or historyId in notification');
      return NextResponse.json({ success: true });
    }

    // Process the notification
    // Note: We create a service instance without credentials since we'll fetch them from the database
    const pushService = new GmailPushService('', '', '');
    await pushService.processPushNotification({
      emailAddress,
      historyId
    });

    console.log(`✅ Processed Gmail push notification for ${emailAddress}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error processing Gmail push notification:', error);
    
    // Always acknowledge the webhook to prevent retries
    return NextResponse.json({ 
      success: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 