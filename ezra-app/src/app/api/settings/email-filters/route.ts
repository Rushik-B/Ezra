import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmailFilterService } from '@/lib/emailFilterService';

const emailFilterService = new EmailFilterService();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await emailFilterService.getFilterSettings(session.userId);
    
    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        isDefault: true, // Indicate these are default settings
        settings: {
          replyScope: 'CONTACTS_ONLY',
          blockedSenders: [],
          allowedSenders: [],
          enablePushNotifications: true // Default to enabled
        }
      });
    }

    return NextResponse.json({
      success: true,
      isDefault: false, // These are saved settings
      settings: {
        replyScope: settings.replyScope,
        blockedSenders: settings.blockedSenders,
        allowedSenders: settings.allowedSenders,
        enablePushNotifications: settings.enablePushNotifications
      }
    });

  } catch (error) {
    console.error('Error fetching email filter settings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch settings' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      replyScope,
      blockedSenders,
      allowedSenders,
      enablePushNotifications
    } = body;

    // Validate input
    const validReplyScopeValues = ['ALL_SENDERS', 'CONTACTS_ONLY'];

    if (replyScope && !validReplyScopeValues.includes(replyScope)) {
      return NextResponse.json({ 
        error: 'Invalid replyScope value' 
      }, { status: 400 });
    }

    // Update settings
    const updatedSettings = await emailFilterService.updateFilterSettings(session.userId, {
      replyScope,
      blockedSenders,
      allowedSenders,
      enablePushNotifications
    });

    console.log(`✅ Updated email filter settings for user ${session.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Email filter settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Error updating email filter settings:', error);
    return NextResponse.json({ 
      error: 'Failed to update settings' 
    }, { status: 500 });
  }
} 