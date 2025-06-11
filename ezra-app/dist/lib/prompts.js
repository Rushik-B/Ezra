"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinalToolContextGeneratorPrompt = exports.getIncomingEmailScannerPrompt = exports.getReplyGenerationPrompt = exports.getStyleAnalysisPrompt = exports.getDefaultMasterPrompt = exports.readPromptFile = exports.DEFAULT_MASTER_PROMPT = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Simple default master prompt text
exports.DEFAULT_MASTER_PROMPT = `You are an AI assistant helping to write professional email replies. 

Keep responses:
- Professional but friendly
- Clear and concise
- Helpful and solution-oriented

Match the tone of the incoming email and be appropriately formal or casual.`;
/**
 * Utility function to read prompt files from the prompts directory
 */
const readPromptFile = (filename) => {
    try {
        const promptPath = path_1.default.join(process.cwd(), 'src/prompts', filename);
        return fs_1.default.readFileSync(promptPath, 'utf-8');
    }
    catch (error) {
        console.error(`Error reading prompt file ${filename}:`, error);
        throw new Error(`Failed to load prompt file: ${filename}`);
    }
};
exports.readPromptFile = readPromptFile;
/**
 * Load default master prompt
 */
const getDefaultMasterPrompt = () => {
    return (0, exports.readPromptFile)('defaultMasterPrompt.md');
};
exports.getDefaultMasterPrompt = getDefaultMasterPrompt;
/**
 * Load style analysis prompt
 */
const getStyleAnalysisPrompt = () => {
    try {
        return (0, exports.readPromptFile)('styleAnalysisPrompt.md');
    }
    catch (error) {
        console.error('Error loading style analysis prompt:', error);
        // Fallback prompt if file doesn't exist
        return `
Analyze the following email history to understand the communication style patterns.

{emailHistory}

{generalUserStyle}

Focus on identifying:
- Tone and formality preferences
- Greeting and closing patterns
- Sentence structure and length
- Vocabulary choices
- Communication personality

Provide a summary that can guide email reply generation.
    `.trim();
    }
};
exports.getStyleAnalysisPrompt = getStyleAnalysisPrompt;
/**
 * Load reply generation prompt
 */
const getReplyGenerationPrompt = () => {
    return (0, exports.readPromptFile)('replyGenerationPrompt.md');
};
exports.getReplyGenerationPrompt = getReplyGenerationPrompt;
/**
 * NEW: Load incoming email scanner prompt
 */
const getIncomingEmailScannerPrompt = () => {
    return (0, exports.readPromptFile)('incomingEmailScannerPrompt.md');
};
exports.getIncomingEmailScannerPrompt = getIncomingEmailScannerPrompt;
/**
 * NEW: Load final tool context generator prompt
 */
const getFinalToolContextGeneratorPrompt = () => {
    return (0, exports.readPromptFile)('finalToolContextGeneratorPrompt.md');
};
exports.getFinalToolContextGeneratorPrompt = getFinalToolContextGeneratorPrompt;
