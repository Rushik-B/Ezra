import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { onboardingQueue } from '@/lib/queues'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.userId
    console.log(`Queuing onboarding process for user: ${userId}`)

    // Check if user already has emails fetched and onboarding complete
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

    // Add the entire onboarding flow as a single job to the queue
    const job = await onboardingQueue.add('process-new-user', { userId }, {
      // Job options
      delay: 0, // Start immediately
      removeOnComplete: 5, // Keep only last 5 completed jobs
      removeOnFail: 3, // Keep only last 3 failed jobs
    })

    // Immediately respond to the client with "202 Accepted"
    console.log(`Queued onboarding job ${job.id} for user ${userId}`)
    return NextResponse.json({ 
      success: true,
      message: 'Onboarding process has been started in the background. This includes email fetching, Master Prompt generation, and POS component creation.',
      jobId: job.id // Send back the Job ID so the frontend can track it
    }, { status: 202 })

  } catch (error) {
    console.error('Error queuing onboarding process:', error)
    
    return NextResponse.json({ 
      error: 'Failed to start onboarding process',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 