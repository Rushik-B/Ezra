import { google } from 'googleapis';
import { prisma } from './prisma';
import { GmailService } from './gmail';
import { ReplyGeneratorService } from './replyGenerator';

export interface PushNotificationPayload {
  emailAddress: string;
  historyId: string;
}

export class GmailPushService {
  private gmail: any;
  private auth: any;
  private userId: string;

  constructor(accessToken: string, refreshToken?: string, userId?: string) {
    this.userId = userId || '';
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    );

    this.auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }

  /**
   * Set up Gmail push notifications for a user
   */
  async setupPushNotifications(topicName: string): Promise<{ historyId: string; expiration: number }> {
    try {
      console.log(`📧 Setting up Gmail push notifications for user: ${this.userId}`);
      
      const request = {
        userId: 'me',
        resource: {
          topicName: topicName,
          labelIds: ['INBOX'], // Only watch inbox
          labelFilterBehavior: 'INCLUDE'
        }
      };

      const response = await this.gmail.users.watch(request);
      
      console.log(`✅ Push notifications setup - historyId: ${response.data.historyId}, expiration: ${response.data.expiration}`);
      
      return {
        historyId: response.data.historyId,
        expiration: response.data.expiration
      };
    } catch (error) {
      console.error('❌ Error setting up Gmail push notifications:', error);
      throw error;
    }
  }

  /**
   * Stop Gmail push notifications for a user
   */
  async stopPushNotifications(): Promise<void> {
    try {
      console.log(`📧 Stopping Gmail push notifications for user: ${this.userId}`);
      
      await this.gmail.users.stop({
        userId: 'me'
      });
      
      console.log(`✅ Push notifications stopped for user: ${this.userId}`);
    } catch (error) {
      console.error('❌ Error stopping Gmail push notifications:', error);
      throw error;
    }
  }

  /**
   * Process a Gmail push notification
   */
  async processPushNotification(payload: PushNotificationPayload): Promise<void> {
    try {
      console.log(`📧 Processing push notification for ${payload.emailAddress}, historyId: ${payload.historyId}`);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { email: payload.emailAddress },
        include: { accounts: true }
      });

      if (!user || !user.accounts.length) {
        console.log(`⚠️ User not found or no OAuth account: ${payload.emailAddress}`);
        return;
      }

      const oauthAccount = user.accounts.find((account: any) => account.provider === 'google');
      if (!oauthAccount || !oauthAccount.accessToken) {
        console.log(`⚠️ No valid Gmail access token for user: ${payload.emailAddress}`);
        return;
      }

      // Get the last known history ID for this user
      const lastHistoryId = await this.getLastHistoryId(user.id);
      
      if (!lastHistoryId) {
        console.log(`No last history ID found for ${user.id}, skipping push notification to avoid full sync.`);
        // To prevent a full sync on first notification, we can just store the historyId and process next time.
        await this.updateLastHistoryId(user.id, payload.historyId);
        return;
      }
      
      if (lastHistoryId >= payload.historyId) {
        console.log(`📧 History ID ${payload.historyId} already processed for user ${user.id}`);
        return;
      }

      // Fetch new emails using Gmail service
      const gmailService = new GmailService(
        oauthAccount.accessToken,
        oauthAccount.refreshToken || undefined,
        user.id
      );

      // Get history of changes since last known history ID
      const newEmails = await this.getNewEmailsFromHistory(gmailService, lastHistoryId || '1', payload.historyId);
      
      if (newEmails.length > 0) {
        console.log(`📧 Found ${newEmails.length} new emails for user ${user.id}`);
        
        // Store new emails in database
        await gmailService.storeEmailsInDatabase(user.id, newEmails);
        
        // Generate replies for new, non-sent emails
        const replyGenerator = new ReplyGeneratorService();
        for (const emailData of newEmails) {
          const savedEmail = await prisma.email.findUnique({ where: { messageId: emailData.messageId } });
          // Only generate replies for incoming emails, not emails sent by the user
          if (savedEmail && !savedEmail.isSent) {
            console.log(`🤖 Generating reply for new email: ${savedEmail.id}`);
            try {
              const generatedReply = await replyGenerator.generateReply({
                userId: user.id,
                incomingEmail: {
                  from: emailData.from,
                  to: emailData.to,
                  subject: emailData.subject,
                  body: emailData.body,
                  date: new Date(emailData.date),
                },
              });

              if (generatedReply.reply) {
                await prisma.generatedReply.create({
                  data: {
                    emailId: savedEmail.id,
                    draft: generatedReply.reply,
                    confidenceScore: generatedReply.confidence,
                  },
                });
                console.log(`✅ Reply generated and saved for email ${savedEmail.id}`);
              }
            } catch (replyError) {
              console.error(`❌ Error generating reply for email ${savedEmail.id}:`, replyError);
            }
          }
        }

        // Update last history ID
        await this.updateLastHistoryId(user.id, payload.historyId);
        
        console.log(`✅ Processed ${newEmails.length} new emails via push notification`);
      } else {
        console.log(`📧 No new emails found in history update for user ${user.id}`);
      }
      
    } catch (error) {
      console.error('❌ Error processing Gmail push notification:', error);
    }
  }

  /**
   * Get new emails from Gmail history
   */
  private async getNewEmailsFromHistory(gmailService: GmailService, startHistoryId: string, endHistoryId: string): Promise<any[]> {
    try {
      // Use Gmail history.list to get changes
      const response = await this.gmail.users.history.list({
        userId: 'me',
        startHistoryId: startHistoryId,
        historyTypes: ['messageAdded']
      });

      const history = response.data.history || [];
      const messageIds: string[] = [];

      // Extract message IDs from history
      history.forEach((historyItem: any) => {
        if (historyItem.messagesAdded) {
          historyItem.messagesAdded.forEach((added: any) => {
            messageIds.push(added.message.id);
          });
        }
      });

      if (messageIds.length === 0) {
        return [];
      }

      // Fetch the actual emails
      const emails = [];
      for (const messageId of messageIds) {
        try {
          const message = await this.gmail.users.messages.get({
            userId: 'me',
            id: messageId
          });

          const parsedEmail = this.parseGmailMessage(message.data);
          if (parsedEmail) {
            emails.push(parsedEmail);
          }
        } catch (error) {
          console.error(`Error fetching message ${messageId}:`, error);
        }
      }

      return emails;
    } catch (error) {
      console.error('❌ Error getting emails from history:', error);
      return [];
    }
  }

  /**
   * Parse Gmail message to our email format
   */
  private parseGmailMessage(message: any): any | null {
    try {
      const headers = message.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      return {
        messageId: message.id,
        from: getHeader('from'),
        to: getHeader('to').split(',').map((email: string) => email.trim()),
        cc: getHeader('cc').split(',').map((email: string) => email.trim()).filter(Boolean),
        subject: getHeader('subject'),
        body: this.extractEmailBody(message.payload),
        snippet: message.snippet || '',
        isSent: message.labelIds?.includes('SENT') || false,
        isDraft: message.labelIds?.includes('DRAFT') || false,
        date: new Date(parseInt(message.internalDate))
      };
    } catch (error) {
      console.error('Error parsing Gmail message:', error);
      return null;
    }
  }

  /**
   * Extract email body from Gmail message payload
   */
  private extractEmailBody(payload: any): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return '';
  }

  /**
   * Get last processed history ID for user (using most recent email as reference)
   */
  private async getLastHistoryId(userId: string): Promise<string | null> {
    try {
      // For now, we'll use a simple approach - get the most recent email's timestamp
      // In a production system, you'd want to store this properly
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
      });
      
      // Return null to fetch from beginning if no emails exist
      return userSettings?.gmailHistoryId || null;
    } catch (error) {
      console.error('Error getting last history ID:', error);
      return null;
    }
  }

  /**
   * Update last processed history ID (this is a placeholder for now)
   */
  private async updateLastHistoryId(userId: string, historyId: string): Promise<void> {
    try {
      // For now, we'll just log the history ID
      // In production, you'd want to store this in a dedicated table
      await prisma.userSettings.upsert({
        where: { userId },
        update: { gmailHistoryId: historyId },
        create: { userId, gmailHistoryId: historyId },
      });
      console.log(`📧 Updated last history ID for user ${userId}: ${historyId}`);
    } catch (error) {
      console.error('Error updating last history ID:', error);
    }
  }
} 