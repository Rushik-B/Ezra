"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allQueues = exports.posGenerationQueue = exports.masterPromptQueue = exports.replyGenerationQueue = exports.onboardingQueue = void 0;
exports.closeQueues = closeQueues;
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("./redis"));
// A queue for the entire new user onboarding process
exports.onboardingQueue = new bullmq_1.Queue('user-onboarding', {
    connection: redis_1.default,
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
exports.replyGenerationQueue = new bullmq_1.Queue('reply-generation', {
    connection: redis_1.default,
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
exports.masterPromptQueue = new bullmq_1.Queue('master-prompt-generation', {
    connection: redis_1.default,
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
exports.posGenerationQueue = new bullmq_1.Queue('pos-generation', {
    connection: redis_1.default,
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
exports.allQueues = {
    onboarding: exports.onboardingQueue,
    replyGeneration: exports.replyGenerationQueue,
    masterPrompt: exports.masterPromptQueue,
    posGeneration: exports.posGenerationQueue,
};
// Graceful shutdown function
async function closeQueues() {
    console.log('🔄 Closing all queues...');
    await Promise.all([
        exports.onboardingQueue.close(),
        exports.replyGenerationQueue.close(),
        exports.masterPromptQueue.close(),
        exports.posGenerationQueue.close(),
    ]);
    console.log('✅ All queues closed');
}
