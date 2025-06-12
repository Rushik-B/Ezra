import { google } from 'googleapis'
import { prisma } from './prisma'
import { EmailContextQuery } from '@/types/worker'

export interface EmailData {
  messageId: string
  gmailThreadId?: string // Gmail's actual thread ID
  from: string
  to: string[]
  cc: string[]
  subject: string
  body: string
  snippet: string
  isSent: boolean
  isDraft: boolean
  date: Date
}

interface GmailMessage {
  id: string
  threadId?: string // Gmail's thread ID
  payload: {
    headers: Array<{ name: string; value: string }>
    body?: { data?: string }
    parts?: Array<{
      mimeType: string
      body?: { data?: string }
      parts?: any[]
    }>
  }
  snippet: string
  labelIds?: string[]
}

export class GmailService {
  private gmail: any
  private auth: any
  private userId: string

  constructor(accessToken: string, refreshToken?: string, userId?: string) {
    this.userId = userId || ''
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    )
    
    this.auth.setCredentials({ 
      access_token: accessToken,
      refresh_token: refreshToken
    })
    
    this.gmail = google.gmail({ version: 'v1', auth: this.auth })
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    try {
      // Check if token needs refresh by making a simple API call
      await this.gmail.users.getProfile({ userId: 'me' })
    } catch (error: any) {
      if (error.code === 401) {
        if (this.auth.credentials.refresh_token && this.userId) {
          console.log('Access token expired, attempting to refresh...')
          try {
            const { credentials } = await this.auth.refreshAccessToken()
            this.auth.setCredentials(credentials)
            
            // Update the token in database
            if (credentials.access_token) {
              await prisma.oAuthAccount.updateMany({
                where: {
                  userId: this.userId,
                  provider: 'google'
                },
                data: {
                  accessToken: credentials.access_token,
                  expiresAt: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null
                }
              })
              console.log('Token refreshed successfully')
            }
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError)
            throw new Error('OAuth token expired and refresh failed. Please re-authenticate.')
          }
        } else {
          console.error('Access token expired and no refresh token available')
          throw new Error('OAuth token expired and no refresh token available. Please sign out and sign in again to re-authorize Gmail access.')
        }
      } else {
        throw error
      }
    }
  }

  async fetchRecentEmails(maxResults: number = 500): Promise<EmailData[]> {
    try {
      console.log(`Fetching ${maxResults} recent emails...`)
      
      // Ensure token is valid before making requests
      await this.refreshTokenIfNeeded()
      
      // Get list of message IDs
      const listResponse = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:sent' //Only sent emails are needed
      })

      if (!listResponse.data.messages) {
        console.log('No Sent messages found')
        return []
      }

      console.log(`Found ${listResponse.data.messages.length} messages, fetching details...`)

      // Fetch details for each message in batches
      const emails: EmailData[] = []
      const batchSize = 10 // Process in smaller batches to avoid rate limits
      
      for (let i = 0; i < listResponse.data.messages.length; i += batchSize) {
        const batch = listResponse.data.messages.slice(i, i + batchSize)
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(listResponse.data.messages.length / batchSize)}`)
        
        const batchPromises = batch.map(async (message: { id: string }) => {
          try {
            const messageResponse = await this.gmail.users.messages.get({
              userId: 'me',
              id: message.id,
              format: 'full'
            })

            return this.parseEmailMessage(messageResponse.data)
          } catch (error) {
            console.error(`Error fetching message ${message.id}:`, error)
            return null
          }
        })

        const batchResults = await Promise.all(batchPromises)
        emails.push(...batchResults.filter(email => email !== null))

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log(`Successfully processed ${emails.length} emails`)
      return emails
    } catch (error) {
      console.error('Error fetching emails:', error)
      throw error
    }
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    inReplyTo?: string;
    threadId?: string;
  }): Promise<any> {
    await this.refreshTokenIfNeeded();

    const { to, subject, body, inReplyTo, threadId } = params;

    const rawMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      inReplyTo ? `In-Reply-To: ${inReplyTo}` : '',
      inReplyTo ? `References: ${inReplyTo}` : '',
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body,
    ]
      .filter(Boolean)
      .join('\n');

    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const requestBody: { raw: string; threadId?: string } = {
      raw: encodedMessage,
    };
    if (threadId) {
      requestBody.threadId = threadId;
    }

    try {
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody,
      });
      console.log(`✅ Email sent successfully to ${to}. Message ID: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error sending email to ${to}:`, error);
      throw error;
    }
  }

  private parseEmailMessage(message: GmailMessage): EmailData | null {
    try {
      const headers = message.payload.headers
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

      // Extract email addresses
      const parseEmailAddresses = (addressString: string): string[] => {
        if (!addressString) return []
        return addressString.split(',').map(addr => {
          const match = addr.match(/<([^>]+)>/)
          return match ? match[1].trim() : addr.trim()
        }).filter(addr => addr.includes('@'))
      }

      // Get email body
      const getEmailBody = (payload: any): string => {
        if (payload.body?.data) {
          return Buffer.from(payload.body.data, 'base64').toString('utf-8')
        }
        
        if (payload.parts) {
          for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
              if (part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString('utf-8')
              }
            }
            // Recursively check nested parts
            const nestedBody = getEmailBody(part)
            if (nestedBody) return nestedBody
          }
        }
        
        return ''
      }

      const from = getHeader('From')
      const to = parseEmailAddresses(getHeader('To'))
      const cc = parseEmailAddresses(getHeader('Cc'))
      const subject = getHeader('Subject')
      const dateHeader = getHeader('Date')
      const body = getEmailBody(message.payload)
      
      // Determine if email is sent or received
      const isSent = message.labelIds?.includes('SENT') || false
      const isDraft = message.labelIds?.includes('DRAFT') || false

      return {
        messageId: message.id,
        gmailThreadId: message.threadId,
        from,
        to,
        cc,
        subject,
        body: body.substring(0, 10000), // Limit body size
        snippet: message.snippet || '',
        isSent,
        isDraft,
        date: dateHeader ? new Date(dateHeader) : new Date()
      }
    } catch (error) {
      console.error('Error parsing email message:', error)
      return null
    }
  }

  async storeEmailsInDatabase(userId: string, emails: EmailData[]): Promise<void> {
    try {
      console.log(`Storing ${emails.length} emails for user ${userId}...`)
      
      for (const email of emails) {
        try {
          // Find or create thread based on subject
          let thread = await prisma.thread.findFirst({
            where: {
              userId,
              subject: email.subject
            }
          })

          if (!thread) {
            // Create thread, handle potential race condition
            try {
              thread = await prisma.thread.create({
                data: {
                  userId,
                  subject: email.subject,
                  snippet: email.snippet
                }
              })
            } catch (threadError: any) {
              // If thread creation fails due to race condition, try to find it again
              if (threadError.code === 'P2002') {
                thread = await prisma.thread.findFirst({
                  where: {
                    userId,
                    subject: email.subject
                  }
                })
                if (!thread) {
                  throw new Error(`Failed to find or create thread for subject: ${email.subject}`)
                }
              } else {
                throw threadError
              }
            }
          }

          email.from = email.from?.toLowerCase?.() ?? email.from
          email.to = email.to?.map?.(addr => addr?.toLowerCase?.() ?? addr) ?? email.to
          email.cc = email.cc?.map?.(addr => addr?.toLowerCase?.() ?? addr) ?? email.cc
          email.subject = email.subject?.toLowerCase?.() ?? email.subject

          // Use upsert to handle potential duplicates gracefully
          await prisma.email.upsert({
            where: { 
              messageId: email.messageId 
            },
            update: {
              // Update fields that might have changed
              snippet: email.snippet,
              gmailThreadId: email.gmailThreadId,
              updatedAt: new Date()
            },
            create: {
              threadId: thread.id,
              messageId: email.messageId,
              gmailThreadId: email.gmailThreadId,
              from: email.from,
              to: email.to,
              cc: email.cc,
              subject: email.subject,
              body: email.body,
              snippet: email.snippet,
              isSent: email.isSent,
              isDraft: email.isDraft,
              createdAt: email.date
            }
          })

        } catch (error: any) {
          // Handle specific database errors more gracefully
          if (error.code === 'P2002') {
            console.log(`Email ${email.messageId} already exists (constraint violation), skipping...`)
          } else {
            console.error(`Error storing email ${email.messageId}:`, error)
          }
          // Continue with next email instead of failing completely
        }
      }

      console.log(`Successfully processed emails for user ${userId}`)
    } catch (error) {
      console.error('Error storing emails in database:', error)
      throw error
    }
  }

  /**
   * NEW: Fetch contextual emails based on specific query parameters
   */
  async fetchContextualEmails(
    userId: string,
    query: EmailContextQuery
  ): Promise<Array<{
    from: string;
    to: string[];
    subject: string;
    body: string;
    date: Date;
    isSent: boolean;
    snippet: string;
  }>> {
    try {
      console.log(`🔍 Fetching contextual emails for user ${userId} with query:`, query);

      // Build date filter based on hint
      let dateFilter = {};
      const now = new Date();
      
      switch (query.dateWindowHint) {
        case 'recent':
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          dateFilter = { createdAt: { gte: thirtyDaysAgo } };
          break;
        case '6months':
          const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
          dateFilter = { createdAt: { gte: sixMonthsAgo } };
          break;
        case '1year':
          const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
          dateFilter = { createdAt: { gte: oneYearAgo } };
          break;
        case 'all':
        default:
          dateFilter = {};
          break;
      }

      // Build search conditions
      const searchConditions: any = {
        thread: {
          userId
        },
        ...dateFilter
      };

      // Add sender filter if specified
      if (query.senderFilter && query.senderFilter.length > 0) {
        searchConditions.OR = [
          { from: { in: query.senderFilter } },
          { to: { hasSome: query.senderFilter } }
        ];
      }

      // Build keyword search if specified
      let keywordSearch: any = {};
      if (query.keywords && query.keywords.length > 0) {
        const keywordConditions = query.keywords.map(keyword => ({
          OR: [
            { subject: { contains: keyword, mode: 'insensitive' } },
            { body: { contains: keyword, mode: 'insensitive' } }
          ]
        }));
        
        keywordSearch = {
          OR: keywordConditions
        };
      }

      // Combine conditions
      const finalConditions = {
        AND: [
          searchConditions,
          ...(Object.keys(keywordSearch).length > 0 ? [keywordSearch] : [])
        ]
      };

      console.log('📊 Search conditions built for contextual fetch');

      // Execute search
      const emails = await prisma.email.findMany({
        where: finalConditions,
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: query.maxResults || 15,
        select: {
          id: true,
          from: true,
          to: true,
          subject: true,
          body: true,
          createdAt: true,
          isSent: true,
          snippet: true
        }
      });

      console.log(`📧 Found ${emails.length} contextual emails`);

      // Log some debugging info
      if (emails.length > 0) {
        console.log(`📅 Date range: ${emails[emails.length - 1].createdAt.toISOString()} to ${emails[0].createdAt.toISOString()}`);
        const keywordMatches = emails.filter(email => 
          query.keywords?.some(keyword => 
            email.subject.toLowerCase().includes(keyword.toLowerCase()) ||
            email.body.toLowerCase().includes(keyword.toLowerCase())
          )
        );
        console.log(`🔍 Emails matching keywords: ${keywordMatches.length}/${emails.length}`);
      }

      return emails.map(email => ({
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
        date: email.createdAt,
        isSent: email.isSent,
        snippet: email.snippet || email.body.substring(0, 150) + '...'
      }));
    } catch (error) {
      console.error('❌ Error fetching contextual emails:', error);
      return [];
    }
  }

  /**
   * Generate a text summary of email context for LLM consumption
   */
  generateEmailContextSummary(emails: Array<{
    from: string;
    to: string[];
    subject: string;
    body: string;
    date: Date;
    isSent: boolean;
    snippet: string;
  }>): string {
    if (emails.length === 0) {
      return 'No relevant email history found for this context.';
    }

    let summary = `RELEVANT EMAIL HISTORY (${emails.length} emails):\n\n`;

    emails.forEach((email, index) => {
      const direction = email.isSent ? 'SENT TO' : 'RECEIVED FROM';
      const otherParty = email.isSent ? email.to.join(', ') : email.from;
      
      summary += `${index + 1}. ${direction} ${otherParty} on ${email.date.toLocaleDateString()}\n`;
      summary += `   Subject: "${email.subject}"\n`;
      summary += `   Snippet: ${email.snippet}\n\n`;
    });

    return summary;
  }
} 