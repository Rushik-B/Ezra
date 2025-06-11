import { Queue } from 'bullmq';
import redisConnection from './redis';

// Job data types for better type safety
export interface OnboardingJobData {
  userId: string;
}

export interface ReplyGenerationJobData {
  emailId: string;
  userId: string;
}

export interface MasterPromptJobData {
  userId: string;
}

export interface POSGenerationJobData {
  userId: string;
}

// A queue for the entire new user onboarding process
export const onboardingQueue = new Queue<OnboardingJobData>('user-onboarding', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry a failed job up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5 seconds before the first retry, then exponentially increase
    },
    removeOnComplete: 10, // Keep only the last 10 completed jobs
    removeOnFail: 5, // Keep only the last 5 failed jobs
  },
});

// A queue for generating individual email replies
export const replyGenerationQueue = new Queue<ReplyGenerationJobData>('reply-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 20,
    removeOnFail: 10,
  },
});

// A queue for generating master prompts
export const masterPromptQueue = new Queue<MasterPromptJobData>('master-prompt-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 5,
    removeOnFail: 5,
  },
});

// A queue for generating POS components (Interaction Network & Strategic Rulebook)
export const posGenerationQueue = new Queue<POSGenerationJobData>('pos-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 5,
    removeOnFail: 5,
  },
});

// Export all queues for easy access
export const allQueues = {
  onboarding: onboardingQueue,
  replyGeneration: replyGenerationQueue,
  masterPrompt: masterPromptQueue,
  posGeneration: posGenerationQueue,
};

// Graceful shutdown function
export async function closeQueues() {
  console.log('🔄 Closing all queues...');
  await Promise.all([
    onboardingQueue.close(),
    replyGenerationQueue.close(),
    masterPromptQueue.close(),
    posGenerationQueue.close(),
  ]);
  console.log('✅ All queues closed');
} 