import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GmailService } from '@/lib/gmail';
import { ReplyGeneratorService } from '@/lib/replyGenerator';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const emailData = await req.json();

    // Find user to associate the email with
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find or create thread
    let thread = await prisma.thread.findFirst({
      where: {
        userId: user.id,
        subject: emailData.subject,
      },
    });

    if (!thread) {
      thread = await prisma.thread.create({
        data: {
          userId: user.id,
          subject: emailData.subject,
          snippet: emailData.body.substring(0, 100),
        },
      });
    }

    // Create and save the email
    const savedEmail = await prisma.email.create({
      data: {
        threadId: thread.id,
        messageId: `${uuidv4()}@test.ezra.com`,
        from: emailData.from,
        to: [emailData.to],
        cc: emailData.cc ? emailData.cc.split(',').map((s: string) => s.trim()) : [],
        subject: emailData.subject,
        body: emailData.body,
        snippet: emailData.body.substring(0, 100),
        isSent: false, // It's an incoming email
        isDraft: false,
      },
    });
    
    console.log(`📝 Test email saved to DB with ID: ${savedEmail.id}`);

    // Generate reply
    try {
      const replyGenerator = new ReplyGeneratorService();
      console.log(`🤖 Generating reply for test email ${savedEmail.id}...`);
      const generatedReply = await replyGenerator.generateReply({
        userId: session.userId,
        incomingEmail: {
          from: savedEmail.from,
          to: savedEmail.to,
          subject: savedEmail.subject,
          body: savedEmail.body,
          date: savedEmail.createdAt,
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
        console.log(`✅ Reply generated and saved for test email ${savedEmail.id}`);
      }
    } catch (replyError) {
      console.error(`❌ Error generating reply for test email:`, replyError);
      // Don't fail the whole request, just log the error
    }

    return NextResponse.json({ success: true, message: 'Test email received and processed.' });
  } catch (error) {
    console.error('❌ Error in test-email endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Return helpful info about how to use this endpoint
  return NextResponse.json({
    endpoint: 'Test Email Simulation',
    description: 'Simulates receiving emails for testing the email processing pipeline',
    usage: {
      method: 'POST',
      requiredFields: ['from', 'subject', 'body'],
      optionalFields: ['to'],
      example: {
        from: 'test@example.com',
        to: 'your-email@gmail.com',
        subject: 'Test Subject',
        body: 'This is a test email body for testing the email processing pipeline.'
      }
    },
    note: 'This endpoint is for testing purposes and simulates the Gmail push notification flow'
  });
} 