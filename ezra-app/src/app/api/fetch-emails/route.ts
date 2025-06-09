import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailService } from '@/lib/gmail'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`Starting email fetch for user: ${session.userId}`)

    // Check if user already has emails fetched
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { emailsFetched: true }
    })

    if (user?.emailsFetched) {
      console.log(`User ${session.userId} already has emails fetched`)
      
      // Get current counts
      const userEmailCount = await prisma.email.count({
        where: {
          thread: {
            userId: session.userId
          }
        }
      })

      const userThreadCount = await prisma.thread.count({
        where: {
          userId: session.userId
        }
      })

      return NextResponse.json({
        message: 'Emails already fetched for this user',
        emailCount: 0,
        totalUserEmails: userEmailCount,
        totalUserThreads: userThreadCount,
        alreadyFetched: true
      })
    }

    // Get user's OAuth token
    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: {
        userId: session.userId,
        provider: 'google'
      }
    })

    if (!oauthAccount || !oauthAccount.accessToken) {
      return NextResponse.json({ error: 'No valid OAuth token found' }, { status: 400 })
    }

    console.log('OAuth token found, initializing Gmail service...')

    // Initialize Gmail service with refresh token support
    const gmailService = new GmailService(
      oauthAccount.accessToken, 
      oauthAccount.refreshToken || undefined, 
      session.userId
    )

    // Fetch emails
    console.log('Fetching emails from Gmail...')
    const emails = await gmailService.fetchRecentEmails(500)

    if (emails.length === 0) {
      console.log('No emails found to process')
      
      // Mark as fetched even if no emails found
      await prisma.user.update({
        where: { id: session.userId },
        data: { emailsFetched: true }
      })
      
      return NextResponse.json({ 
        message: 'No emails found',
        emailCount: 0,
        totalUserEmails: 0,
        totalUserThreads: 0
      })
    }

    // Store emails in database
    console.log(`Storing ${emails.length} emails in database...`)
    await gmailService.storeEmailsInDatabase(session.userId, emails)

    // Mark user as having emails fetched
    await prisma.user.update({
      where: { id: session.userId },
      data: { emailsFetched: true }
    })

    // Get final counts
    const userEmailCount = await prisma.email.count({
      where: {
        thread: {
          userId: session.userId
        }
      }
    })

    const userThreadCount = await prisma.thread.count({
      where: {
        userId: session.userId
      }
    })

    console.log(`Email fetch completed. User now has ${userEmailCount} emails in ${userThreadCount} threads`)

    return NextResponse.json({
      message: 'Emails fetched and stored successfully',
      emailCount: emails.length,
      totalUserEmails: userEmailCount,
      totalUserThreads: userThreadCount
    })

  } catch (error) {
    console.error('Error in fetch-emails API:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 