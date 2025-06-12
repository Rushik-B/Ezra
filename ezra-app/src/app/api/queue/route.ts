import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { QueueItem } from '@/types';
import { GmailService } from '@/lib/gmail';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch emails that are not sent by the user, have no feedback, and have a generated reply
    const unprocessedEmails = await prisma.email.findMany({
      where: {
        thread: {
          userId: session.userId,
        },
        isSent: false,
        feedback: null, // No feedback action taken yet
        generatedReply: {
          isNot: null, // Must have a generated reply
        },
      },
      include: {
        generatedReply: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map to QueueItem format
    const queueItems: QueueItem[] = unprocessedEmails.map(email => ({
      id: email.id,
      actionSummary: `Reply to: ${email.subject}`,
      contextSummary: `From: ${email.from}`,
      status: 'needs-attention',
      confidence: email.generatedReply!.confidenceScore,
      draftPreview: email.generatedReply!.draft.substring(0, 150) + '...',
      fullDraft: email.generatedReply!.draft,
      metadata: {
        emailId: email.id,
        from: email.from,
        subject: email.subject,
        body: email.body,
        receivedAt: email.createdAt.toISOString(),
      },
    }));

    return NextResponse.json({ success: true, queueItems });
  } catch (error) {
    console.error('Error fetching queue:', error);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, emailId, feedback, draftContent } = await req.json();

    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { thread: true, generatedReply: true },
    });

    if (!email || email.thread.userId !== session.userId) {
      return NextResponse.json({ error: 'Email not found or not owned by user' }, { status: 404 });
    }

    if (!email.thread) {
      return NextResponse.json({ error: 'Thread not found for email' }, { status: 404 });
    }

    switch (action) {
      case 'approve':
      case 'edit':
        const replyContent = action === 'edit' ? draftContent : email.generatedReply?.draft;
        if (!replyContent) {
          return NextResponse.json({ error: 'No draft content to send' }, { status: 400 });
        }

        const oauth = await prisma.oAuthAccount.findFirst({
          where: { userId: session.userId, provider: 'google' },
        });

        if (!oauth?.accessToken) {
          return NextResponse.json({ error: 'User google account not found' }, { status: 404 });
        }

        // Send the email using Gmail API
        const gmailService = new GmailService(oauth.accessToken, oauth.refreshToken || undefined, session.userId);
        
        console.log(`📧 Sending email to ${email.from}...`);
        console.log(`📧 Threading: Using Message-ID: ${email.rfc2822MessageId} and References: ${email.references}`);
        try {
          const sentMessage = await gmailService.sendEmail({
            to: email.from,
            subject: `Re: ${email.subject}`,
            body: replyContent,
            inReplyTo: email.rfc2822MessageId || undefined, // Use proper RFC 2822 Message-ID for threading
            references: email.references || undefined, // Use existing References chain
            threadId: email.gmailThreadId || undefined, // Use Gmail's actual thread ID for proper threading
          });
          
          console.log(`✅ Email sent successfully! Message ID: ${sentMessage.id}`);

          // Create a sent email record in the database
          await prisma.email.create({
            data: {
              threadId: email.threadId,
              messageId: sentMessage.id, // Use real Gmail message ID
              gmailThreadId: email.gmailThreadId, // Maintain Gmail thread ID for consistency
              from: session.user?.email || 'user@example.com', // User's email as sender
              to: [email.from], // Reply to original sender
              cc: [],
              subject: `Re: ${email.subject}`,
              body: replyContent,
              snippet: replyContent.substring(0, 150) + '...',
              isSent: true, // Mark as sent
              isDraft: false,
              createdAt: new Date()
            }
          });
          
        } catch (sendError) {
          console.error(`❌ Failed to send email:`, sendError);
          
          // If it's an authentication error, we should still record the feedback but not create the sent email
          if (sendError instanceof Error && sendError.message.includes('auth')) {
            return NextResponse.json({ 
              error: 'Authentication failed. Please reconnect your Google account.',
              authError: true 
            }, { status: 401 });
          }
          
          // For other errors, use upsert to prevent duplicate feedback errors
          await prisma.feedback.upsert({
            where: { emailId: emailId },
            update: {
              action: 'REJECTED',
              editDelta: { 
                error: sendError instanceof Error ? sendError.message : 'Unknown send error',
                attemptedContent: replyContent 
              },
            },
            create: {
              userId: session.userId,
              emailId: emailId,
              action: 'REJECTED',
              editDelta: { 
                error: sendError instanceof Error ? sendError.message : 'Unknown send error',
                attemptedContent: replyContent 
              },
            },
          });
          
          return NextResponse.json({ 
            error: 'Failed to send email',
            details: sendError instanceof Error ? sendError.message : 'Unknown error'
          }, { status: 500 });
        }

        // Use upsert to prevent duplicate feedback errors
        await prisma.feedback.upsert({
          where: { emailId: emailId },
          update: {
            action: action === 'approve' ? 'ACCEPTED' : 'EDITED',
            editDelta: action === 'edit' ? { original: email.generatedReply?.draft, final: draftContent } : undefined,
          },
          create: {
            userId: session.userId,
            emailId: emailId,
            action: action === 'approve' ? 'ACCEPTED' : 'EDITED',
            editDelta: action === 'edit' ? { original: email.generatedReply?.draft, final: draftContent } : undefined,
          },
        });

        // Create action history record for the History page
        await prisma.actionHistory.create({
          data: {
            userId: session.userId,
            actionType: action === 'approve' ? 'EMAIL_SENT' : 'EMAIL_EDITED',
            actionSummary: action === 'approve' 
              ? `Auto-replied to ${email.from.split('@')[0]} - ${email.subject}`
              : `Edited and sent reply to ${email.from.split('@')[0]} - ${email.subject}`,
            actionDetails: {
              emailFrom: email.from,
              emailSubject: email.subject,
              originalDraft: email.generatedReply?.draft,
              finalContent: replyContent,
              wasEdited: action === 'edit'
            },
            emailReference: emailId,
            confidence: email.generatedReply?.confidenceScore,
            undoable: true, // Email sending could potentially be undone
            metadata: {
              sender: email.from,
              subject: email.subject,
              action: action === 'approve' ? 'approved' : 'edited'
            }
          }
        });
        
        break;

      case 'reject':
        // Use upsert to prevent duplicate feedback errors
        await prisma.feedback.upsert({
          where: { emailId: emailId },
          update: {
            action: 'REJECTED',
            editDelta: { reason: feedback },
          },
          create: {
            userId: session.userId,
            emailId: emailId,
            action: 'REJECTED',
            editDelta: { reason: feedback },
          },
        });

        // Create action history record for rejection
        await prisma.actionHistory.create({
          data: {
            userId: session.userId,
            actionType: 'EMAIL_REJECTED',
            actionSummary: `Rejected draft for ${email.from.split('@')[0]} - ${email.subject}`,
            actionDetails: {
              emailFrom: email.from,
              emailSubject: email.subject,
              rejectedDraft: email.generatedReply?.draft,
              rejectionReason: feedback
            },
            emailReference: emailId,
            confidence: email.generatedReply?.confidenceScore,
            undoable: false, // Rejection cannot be undone
            metadata: {
              sender: email.from,
              subject: email.subject,
              feedback: feedback
            }
          }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error processing queue action:`, error);
    return NextResponse.json({ error: 'Failed to process queue action' }, { status: 500 });
  }
} 