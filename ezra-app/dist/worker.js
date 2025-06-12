"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("./lib/redis"));
const masterPromptGenerator_1 = require("./lib/masterPromptGenerator");
const replyGenerator_1 = require("./lib/replyGenerator");
const gmail_1 = require("./lib/gmail");
const prisma_1 = require("./lib/prisma");
console.log('🚀 Background Worker process started...');
// Track active workers for graceful shutdown
const workers = [];
// --- Worker for the New User Onboarding Flow ---
const onboardingWorker = new bullmq_1.Worker('user-onboarding', async (job) => {
    const { userId } = job.data;
    console.log(`[ONBOARD START] Processing onboarding for user: ${userId} (Job ID: ${job.id})`);
    try {
        job.updateProgress(10);
        // Get user's current completion status
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailsFetched: true,
                masterPromptGenerated: true,
                interactionNetworkGenerated: true,
                strategicRulebookGenerated: true
            }
        });
        if (!user) {
            throw new Error(`User ${userId} not found`);
        }
        console.log(`[ONBOARD] User ${userId} status: emails=${user.emailsFetched}, master=${user.masterPromptGenerated}, network=${user.interactionNetworkGenerated}, rulebook=${user.strategicRulebookGenerated}`);
        const generator = new masterPromptGenerator_1.MasterPromptGeneratorService();
        // Step 1: Fetch emails if not done
        if (!user.emailsFetched) {
            console.log(`[ONBOARD] 📧 Fetching emails for user ${userId}...`);
            await fetchEmailsForUser(userId);
            console.log(`[ONBOARD] ✅ Emails fetched successfully for user ${userId}`);
        }
        else {
            console.log(`[ONBOARD] ✅ Emails already fetched for user ${userId}`);
        }
        job.updateProgress(30);
        // Step 2: Generate Master Prompt if not done
        if (!user.masterPromptGenerated) {
            console.log(`[ONBOARD] 🧠 Generating Master Prompt for user ${userId}...`);
            try {
                await generator.generateAndSaveMasterPrompt(userId);
                // Mark as completed ONLY on success
                await prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: { masterPromptGenerated: true }
                });
                console.log(`[ONBOARD] ✅ Master Prompt generated successfully for user ${userId}`);
            }
            catch (error) {
                console.error(`[ONBOARD] ❌ Master Prompt generation failed for user ${userId}:`, error);
                throw error; // Let BullMQ retry
            }
        }
        else {
            console.log(`[ONBOARD] ✅ Master Prompt already generated for user ${userId}`);
        }
        job.updateProgress(60);
        // Step 3: Generate Interaction Network if not done
        if (!user.interactionNetworkGenerated) {
            console.log(`[ONBOARD] 🤝 Generating Interaction Network for user ${userId}...`);
            try {
                await generator.generateAndSaveInteractionNetwork(userId);
                // Mark as completed ONLY on success
                await prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: { interactionNetworkGenerated: true }
                });
                console.log(`[ONBOARD] ✅ Interaction Network generated successfully for user ${userId}`);
            }
            catch (error) {
                console.error(`[ONBOARD] ❌ Interaction Network generation failed for user ${userId}:`, error);
                throw error; // Let BullMQ retry
            }
        }
        else {
            console.log(`[ONBOARD] ✅ Interaction Network already generated for user ${userId}`);
        }
        job.updateProgress(80);
        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Step 4: Generate Strategic Rulebook if not done
        if (!user.strategicRulebookGenerated) {
            console.log(`[ONBOARD] 📜 Generating Strategic Rulebook for user ${userId}...`);
            try {
                await generator.generateAndSaveStrategicRulebook(userId);
                // Mark as completed ONLY on success
                await prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: { strategicRulebookGenerated: true }
                });
                console.log(`[ONBOARD] ✅ Strategic Rulebook generated successfully for user ${userId}`);
            }
            catch (error) {
                console.error(`[ONBOARD] ❌ Strategic Rulebook generation failed for user ${userId}:`, error);
                throw error; // Let BullMQ retry
            }
        }
        else {
            console.log(`[ONBOARD] ✅ Strategic Rulebook already generated for user ${userId}`);
        }
        job.updateProgress(100);
        console.log(`[ONBOARD COMPLETE] 🎉 All onboarding steps completed for user: ${userId}`);
    }
    catch (error) {
        console.error(`[ONBOARD FAILED] Onboarding failed for user ${userId}:`, error);
        // This makes BullMQ retry the job according to our backoff strategy
        throw error;
    }
}, {
    connection: redis_1.default,
    concurrency: 2 // Process up to 2 onboarding jobs simultaneously
});
// --- Worker for Master Prompt Generation ---
const masterPromptWorker = new bullmq_1.Worker('master-prompt-generation', async (job) => {
    const { userId } = job.data;
    console.log(`[MASTER START] Generating Master Prompt for user: ${userId} (Job ID: ${job.id})`);
    try {
        job.updateProgress(10);
        const generator = new masterPromptGenerator_1.MasterPromptGeneratorService();
        const result = await generator.generateAndSaveMasterPrompt(userId);
        job.updateProgress(100);
        console.log(`[MASTER COMPLETE] Master Prompt v${result.version} generated for user ${userId} with ${result.confidence}% confidence`);
        return result;
    }
    catch (error) {
        console.error(`[MASTER FAILED] Master Prompt generation failed for user ${userId}:`, error);
        throw error;
    }
}, {
    connection: redis_1.default,
    concurrency: 3 // Process up to 3 master prompt jobs simultaneously
});
// --- Worker for POS Generation ---
const posWorker = new bullmq_1.Worker('pos-generation', async (job) => {
    const { userId } = job.data;
    console.log(`[POS START] Generating POS components for user: ${userId} (Job ID: ${job.id})`);
    try {
        job.updateProgress(10);
        const generator = new masterPromptGenerator_1.MasterPromptGeneratorService();
        // Generate Interaction Network
        console.log(`[POS] Generating Interaction Network for ${userId}...`);
        await generator.generateAndSaveInteractionNetwork(userId);
        job.updateProgress(50);
        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Generate Strategic Rulebook
        console.log(`[POS] Generating Strategic Rulebook for ${userId}...`);
        await generator.generateAndSaveStrategicRulebook(userId);
        job.updateProgress(100);
        console.log(`[POS COMPLETE] POS components generated for user ${userId}`);
    }
    catch (error) {
        console.error(`[POS FAILED] POS generation failed for user ${userId}:`, error);
        throw error;
    }
}, {
    connection: redis_1.default,
    concurrency: 2 // Process up to 2 POS jobs simultaneously
});
// --- Worker for Generating Email Replies ---
const replyWorker = new bullmq_1.Worker('reply-generation', async (job) => {
    const { emailId, userId } = job.data;
    console.log(`[REPLY START] Generating reply for email: ${emailId} (Job ID: ${job.id})`);
    try {
        job.updateProgress(10);
        // Get the email
        const email = await prisma_1.prisma.email.findUnique({
            where: { id: emailId },
            include: { thread: true }
        });
        if (!email) {
            throw new Error(`Email ${emailId} not found`);
        }
        // Verify the email belongs to the user
        if (email.thread.userId !== userId) {
            throw new Error(`Email ${emailId} does not belong to user ${userId}`);
        }
        job.updateProgress(30);
        // Generate the reply
        const replyGenerator = new replyGenerator_1.ReplyGeneratorService();
        const replyResult = await replyGenerator.generateReply({
            userId: userId,
            incomingEmail: {
                from: email.from,
                to: email.to,
                subject: email.subject,
                body: email.body,
                date: email.createdAt,
                threadId: email.threadId // Add thread ID for conversation context
            }
        });
        job.updateProgress(80);
        // Store the generated reply
        await prisma_1.prisma.generatedReply.create({
            data: {
                emailId: emailId,
                draft: replyResult.reply,
                confidenceScore: replyResult.confidence
            }
        });
        job.updateProgress(100);
        console.log(`[REPLY COMPLETE] Reply generated for email ${emailId} with ${replyResult.confidence}% confidence`);
        return {
            emailId,
            confidence: replyResult.confidence,
            replyPreview: replyResult.reply.substring(0, 150) + (replyResult.reply.length > 150 ? '...' : '')
        };
    }
    catch (error) {
        console.error(`[REPLY FAILED] Reply generation failed for email ${emailId}:`, error);
        throw error;
    }
}, {
    connection: redis_1.default,
    concurrency: 5 // Process up to 5 reply jobs simultaneously
});
// Helper function to fetch emails for a user
async function fetchEmailsForUser(userId) {
    console.log(`[EMAIL FETCH] Starting email fetch for user ${userId}`);
    // Get user's OAuth token
    const oauthAccount = await prisma_1.prisma.oAuthAccount.findFirst({
        where: {
            userId: userId,
            provider: 'google'
        }
    });
    if (!oauthAccount || !oauthAccount.accessToken) {
        throw new Error(`No valid OAuth token found for user ${userId}`);
    }
    // Initialize Gmail service
    const gmailService = new gmail_1.GmailService(oauthAccount.accessToken, oauthAccount.refreshToken || undefined, userId);
    // Fetch emails
    console.log(`[EMAIL FETCH] Fetching last 180 sent emails from Gmail for user ${userId}...`);
    const emails = await gmailService.fetchRecentEmails(180);
    if (emails.length === 0) {
        console.log(`[EMAIL FETCH] No sent emails found for user ${userId}`);
        // Mark as fetched even if no emails found
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { emailsFetched: true }
        });
        return;
    }
    // Store emails in database
    console.log(`[EMAIL FETCH] Storing ${emails.length} emails in database for user ${userId}...`);
    await gmailService.storeEmailsInDatabase(userId, emails);
    // Mark user as having emails fetched
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { emailsFetched: true }
    });
    const userEmailCount = await prisma_1.prisma.email.count({
        where: {
            thread: {
                userId: userId
            }
        }
    });
    console.log(`[EMAIL FETCH COMPLETE] User ${userId} now has ${userEmailCount} emails stored`);
}
// Store worker references for cleanup
workers.push(onboardingWorker, masterPromptWorker, posWorker, replyWorker);
// Graceful shutdown handling
async function gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
    try {
        // Close all workers
        console.log('📦 Closing all workers...');
        await Promise.all(workers.map(worker => worker.close()));
        // Close Redis connection
        console.log('🔌 Closing Redis connection...');
        await redis_1.default.quit();
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
    }
}
// Setup signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('🚨 Unhandled promise rejection:', error);
    gracefulShutdown('unhandledRejection');
});
// Worker event logging
workers.forEach((worker, index) => {
    const workerNames = ['onboarding', 'masterPrompt', 'pos', 'reply'];
    const name = workerNames[index];
    worker.on('completed', (job) => {
        console.log(`✅ [${name.toUpperCase()}] Job ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
        console.error(`❌ [${name.toUpperCase()}] Job ${job?.id} failed:`, err.message);
    });
    worker.on('stalled', (jobId) => {
        console.warn(`⚠️ [${name.toUpperCase()}] Job ${jobId} stalled`);
    });
});
console.log('🎯 Background workers are ready and listening for jobs...');
console.log('📊 Worker configuration:');
console.log('  - Onboarding: concurrency 2');
console.log('  - Master Prompt: concurrency 3');
console.log('  - POS Generation: concurrency 2');
console.log('  - Reply Generation: concurrency 5');
