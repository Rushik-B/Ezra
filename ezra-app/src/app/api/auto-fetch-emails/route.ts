import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailService } from '@/lib/gmail'
import { prisma } from '@/lib/prisma'

// In-memory lock to prevent concurrent fetches for the same user
const userFetchLocks = new Map<string, boolean>()

export async function POST() {
  let userId: string | undefined

  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    userId = session.userId
    console.log(`Checking if emails need to be fetched for user: ${userId}`)

    // Check if there's already a fetch in progress for this user
    if (userFetchLocks.get(userId)) {
      console.log(`Auto-fetch already in progress for user ${userId}, skipping...`)
      return NextResponse.json({
        message: 'Email fetch already in progress for this user',
        inProgress: true
      })
    }

    // Check if user already has emails fetched
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailsFetched: true }
    })

    if (user?.emailsFetched) {
      console.log(`User ${userId} already has emails fetched, skipping auto-fetch`)
      return NextResponse.json({
        message: 'Emails already fetched for this user',
        skipped: true
      })
    }

    // Set lock for this user
    userFetchLocks.set(userId, true)
    console.log(`User ${userId} needs email fetch, starting automatic fetch...`)

    try {
      // Get user's OAuth token
      const oauthAccount = await prisma.oAuthAccount.findFirst({
        where: {
          userId: userId,
          provider: 'google'
        }
      })

      if (!oauthAccount || !oauthAccount.accessToken) {
        console.log(`No valid OAuth token found for user ${userId}`)
        return NextResponse.json({ error: 'No valid OAuth token found' }, { status: 400 })
      }

      console.log('OAuth token found, initializing Gmail service for auto-fetch...')

      // Initialize Gmail service with refresh token support
      const gmailService = new GmailService(
        oauthAccount.accessToken, 
        oauthAccount.refreshToken || undefined, 
        userId
      )

      // Fetch emails
      console.log('Auto-fetching last 500 sent emails from Gmail...')
      const emails = await gmailService.fetchRecentEmails(500)

      if (emails.length === 0) {
        console.log('No sent emails found during auto-fetch')
        
        // Mark as fetched even if no emails found
        await prisma.user.update({
          where: { id: userId },
          data: { emailsFetched: true }
        })
        
        return NextResponse.json({ 
          message: 'Auto-fetch completed - no sent emails found',
          emailCount: 0,
          totalUserEmails: 0,
          totalUserThreads: 0
        })
      }

      // Store emails in database
      console.log(`Auto-storing ${emails.length} emails in database...`)
      await gmailService.storeEmailsInDatabase(userId, emails)

      // Mark user as having emails fetched
      await prisma.user.update({
        where: { id: userId },
        data: { emailsFetched: true }
      })

      // Get final counts
      const userEmailCount = await prisma.email.count({
        where: {
          thread: {
            userId: userId
          }
        }
      })

      const userThreadCount = await prisma.thread.count({
        where: {
          userId: userId
        }
      })

      console.log(`Auto-fetch completed. User now has ${userEmailCount} emails in ${userThreadCount} threads`)

      // Trigger Master Prompt generation in a separate function to avoid timeout
      try {
        console.log('🚀 Triggering Master Prompt generation in separate function...');
        
        // Call the generate endpoint asynchronously - don't wait for response
        fetch(`${process.env.NEXTAUTH_URL || 'https://ezra-frontend.vercel.app'}/api/master-prompt/auto-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userId}` // Simple auth using userId
          },
          body: JSON.stringify({ userId })
        }).catch(error => {
          console.error('❌ Error triggering Master Prompt generation:', error);
        });

        console.log('✅ Master Prompt generation triggered successfully');
      } catch (error) {
        console.error('❌ Error triggering Master Prompt generation:', error);
        // Don't fail the auto-fetch if trigger fails
      }

      return NextResponse.json({
        message: 'Auto-fetch completed successfully - Master Prompt generation started',
        emailCount: emails.length,
        totalUserEmails: userEmailCount,
        totalUserThreads: userThreadCount,
        masterPromptGenerationTriggered: true
      })

    } finally {
      // Always release the lock
      userFetchLocks.delete(userId)
      console.log(`Released auto-fetch lock for user ${userId}`)
    }

  } catch (error) {
    console.error('Error in auto-fetch-emails API:', error)
    
    // Make sure to release the lock on error
    if (userId) {
      userFetchLocks.delete(userId)
    }
    
    return NextResponse.json({ 
      error: 'Failed to auto-fetch emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 