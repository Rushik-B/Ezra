import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import { getStyleAnalysisPrompt, getReplyGenerationPrompt, readPromptFile } from './prompts';
import { IncomingEmailScannerOutput } from '@/types/worker';
import { getEncoding, type Tiktoken } from 'js-tiktoken';

// Global token tracking interface
interface TokenTracker {
  totalPromptTokens: number;
  totalResponseTokens: number;
  calls: Array<{
    label: string;
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  }>;
}

declare global {
  // eslint-disable-next-line no-var
  var tokenTracker: TokenTracker | undefined;
}

export interface EmailContext {
  incomingEmail: {
    from: string;
    to: string[];
    subject: string;
    body: string;
    date: Date;
  };
  historicalEmails: Array<{
    from: string;
    to: string[];
    subject: string;
    body: string;
    date: Date;
    isSent: boolean;
  }>;
}

export interface ReplyGenerationResult {
  reply: string;
  confidence: number;
  reasoning: string;
}

export class LLMService {
  private model: ChatGoogleGenerativeAI;
  private liteModel: ChatGoogleGenerativeAI;
  private advancedModel: ChatGoogleGenerativeAI;
  private tokenizer: Tiktoken;
  private requestQueue: Array<() => Promise<unknown>> = [];
  private isProcessingQueue: boolean = false;
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 4000; // 4 seconds between requests for free tier

  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      console.error("❌ GOOGLE_API_KEY environment variable is not set!");
      throw new Error("GOOGLE_API_KEY environment variable is required");
    }

    // Main model for complex tasks
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    // Lite model for context generation to reduce rate limiting
    this.liteModel = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    // Advanced model for complex tasks with large context window
    try {
      this.advancedModel = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash-preview-05-20",
        apiKey: process.env.GOOGLE_API_KEY,
        temperature: 0.6,
        maxOutputTokens: 16384,
      });
      console.log("✅ Advanced model initialized successfully");
    } catch (error) {
      console.warn("⚠️ Failed to initialize advanced model, falling back to standard model:", error);
      this.advancedModel = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash-preview-05-20",
        apiKey: process.env.GOOGLE_API_KEY,
        temperature: 0.7,
        maxOutputTokens: 16384,
      });
      console.log("✅ Fallback to standard model for advanced tasks");
    }

    // Initialize tokenizer for accurate token counting
    this.tokenizer = getEncoding("cl100k_base"); // GPT-4 encoding
  }

  /**
   * Rate-limited request execution to prevent 503 errors on free tier
   */
  private async executeWithRateLimit<T>(requestFn: () => Promise<T>, retries: number = 3): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.retryRequest(requestFn, retries);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Process request queue with rate limiting
   */
  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const currentTime = Date.now();
      const timeSinceLastRequest = currentTime - this.lastRequestTime;

      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        const delay = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`🕐 Rate limiting: waiting ${delay}ms before next API call`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const request = this.requestQueue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Retry logic for 503 and rate limit errors
   */
  private async retryRequest<T>(requestFn: () => Promise<T>, retries: number): Promise<T> {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        return await requestFn();
      } catch (error: unknown) {
        const is503Error = error instanceof Error && (error.message?.includes('503') || error.message?.includes('overloaded'));
        const is429Error = error instanceof Error && (error.message?.includes('429') || error.message?.includes('rate limit'));
        
        if ((is503Error || is429Error) && attempt <= retries) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Exponential backoff, max 30s
          console.log(`⚠️ API overloaded (attempt ${attempt}/${retries + 1}), retrying in ${backoffDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        }
        
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Count tokens in text using tiktoken
   */
  private countTokens(text: string): number {
    try {
      return this.tokenizer.encode(text).length;
    } catch (error) {
      console.warn("⚠️ Error counting tokens, falling back to character estimate:", error);
      // Fallback: rough estimate of tokens (4 characters per token on average)
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Log token usage for debugging and track totals
   */
  private logTokenUsage(label: string, promptText: string, responseText?: string) {
    const promptTokens = this.countTokens(promptText);
    console.log(`🔢 ${label} - Prompt tokens: ${promptTokens} (${promptText.length} chars)`);
    
    if (responseText) {
      const responseTokens = this.countTokens(responseText);
      console.log(`🔢 ${label} - Response tokens: ${responseTokens} (${responseText.length} chars)`);
      
      // Track running totals
      if (!globalThis.tokenTracker) {
        globalThis.tokenTracker = { totalPromptTokens: 0, totalResponseTokens: 0, calls: [] };
      }
      globalThis.tokenTracker.totalPromptTokens += promptTokens;
      globalThis.tokenTracker.totalResponseTokens += responseTokens;
      globalThis.tokenTracker.calls.push({
        label,
        promptTokens,
        responseTokens,
        totalTokens: promptTokens + responseTokens
      });
    }
  }

  /**
   * Get total token usage summary and reset tracker
   */
  public static getTokenSummary(): { totalPromptTokens: number; totalResponseTokens: number; totalTokens: number; calls: TokenTracker['calls'] } {
    if (!globalThis.tokenTracker) {
      return { totalPromptTokens: 0, totalResponseTokens: 0, totalTokens: 0, calls: [] };
    }
    
    const summary = {
      totalPromptTokens: globalThis.tokenTracker.totalPromptTokens,
      totalResponseTokens: globalThis.tokenTracker.totalResponseTokens,
      totalTokens: globalThis.tokenTracker.totalPromptTokens + globalThis.tokenTracker.totalResponseTokens,
      calls: [...globalThis.tokenTracker.calls]
    };
    
    // Reset tracker for next request
    globalThis.tokenTracker = { totalPromptTokens: 0, totalResponseTokens: 0, calls: [] };
    
    return summary;
  }

  /**
   * Generates text based on a prompt (used for Master Prompt generation)
   */
  async generateText(prompt: string): Promise<string> {
    console.log("🤖 Starting LLM text generation...");
    
    const systemMessage = "You are an expert at analyzing communication patterns and generating comprehensive style guides.";
    const fullPrompt = systemMessage + "\n\n" + prompt;
    this.logTokenUsage("GenerateText", fullPrompt);

    try {
      const result = await this.executeWithRateLimit(async () => {
        if (!this.advancedModel) {
          throw new Error("Advanced model not properly initialized");
        }
        const response = await this.advancedModel.invoke([
          new SystemMessage(systemMessage),
          new HumanMessage(prompt)
        ]);
        
        // Validate response
        if (!response || !response.content || typeof response.content !== 'string') {
          throw new Error(`Invalid LLM response: ${JSON.stringify(response)}`);
        }
        
        return response.content as string;
      });

      console.log("📥 Received response from LLM");
      this.logTokenUsage("GenerateText", fullPrompt, result);
      
      return result;
    } catch (error) {
      console.error("❌ Error generating text:", error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates a distilled (summary) version of a full Master Prompt.
   */
  async generateDistilledMasterPrompt(fullMasterPrompt: string): Promise<string> {
    console.log("🌀 Starting distilled Master Prompt generation...");
    const distillPromptTemplate = readPromptFile('distilledMasterPromptGenerator.md');
    const prompt = distillPromptTemplate.replace('{fullMasterPrompt}', fullMasterPrompt);

    const systemMessage = "You are an AI Style Summarizer, skilled at creating concise, human-readable summaries of detailed text.";
    const fullPrompt = systemMessage + "\n\n" + prompt;
    this.logTokenUsage("DistilledMasterPrompt", fullPrompt);

    try {
      const distilledPrompt = await this.executeWithRateLimit(async () => {
        const response = await this.model.invoke([
          new SystemMessage(systemMessage),
          new HumanMessage(prompt)
        ]);
        return response.content as string;
      });
      
      this.logTokenUsage("DistilledMasterPrompt", fullPrompt, distilledPrompt);
      console.log("✅ Distilled Master Prompt generated.");
      return distilledPrompt.trim();
    } catch (error) {
      console.error("❌ Error generating distilled Master Prompt:", error);
      throw new Error(`Failed to generate distilled Master Prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates a full Master Prompt based on user edits to its distilled version.
   */
  async updateFullMasterPrompt(
    originalFullMasterPrompt: string, 
    originalDistilledPrompt: string, 
    userEditedDistilledPrompt: string
  ): Promise<string> {
    console.log("🔄 Starting full Master Prompt update from distilled edits...");
    const updaterPromptTemplate = readPromptFile('masterPromptUpdaterFromDistilled.md');
    const prompt = updaterPromptTemplate
      .replace('{originalFullMasterPrompt}', originalFullMasterPrompt)
      .replace('{originalDistilledPrompt}', originalDistilledPrompt)
      .replace('{userEditedDistilledPrompt}', userEditedDistilledPrompt);

    const systemMessage = "You are an AI Master Prompt Synchronizer, skilled at intelligently merging user feedback into structured documents.";
    const fullPrompt = systemMessage + "\n\n" + prompt;
    this.logTokenUsage("UpdateFullMasterPrompt", fullPrompt);

    try {
      const updatedFullPrompt = await this.executeWithRateLimit(async () => {
        const response = await this.advancedModel.invoke([
          new SystemMessage(systemMessage),
          new HumanMessage(prompt)
        ]);
        return response.content as string;
      });
      
      this.logTokenUsage("UpdateFullMasterPrompt", fullPrompt, updatedFullPrompt);
      console.log("✅ Full Master Prompt updated from distilled edits.");
      return updatedFullPrompt.trim();
    } catch (error) {
      console.error("❌ Error updating full Master Prompt from distilled edits:", error);
      throw new Error(`Failed to update full Master Prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyzes historical emails to generate a style summary
   */
  async generateStyleSummary(historicalEmails: EmailContext['historicalEmails']): Promise<string> {
    if (historicalEmails.length === 0) {
      return "No historical communication style data available.";
    }

    const styleAnalysisPrompt = PromptTemplate.fromTemplate(getStyleAnalysisPrompt());

    const emailHistoryText = historicalEmails
      .map((email, index) => `
        Email ${index + 1}:
        From: ${email.from}
        To: ${email.to.join(', ')}
        Subject: ${email.subject}
        Body: ${email.body.substring(0, 500)}...
        Sent by user: ${email.isSent}
        ---
      `)
      .join('\n');

    try {
      const prompt = await styleAnalysisPrompt.format({
        emailHistory: emailHistoryText,
        generalUserStyle: "Default communication style for analysis comparison."
      });

      const systemMessage = "You are an expert at analyzing communication styles and patterns.";
      const fullPrompt = systemMessage + "\n\n" + prompt;
      this.logTokenUsage("StyleSummary", fullPrompt);

      const result = await this.executeWithRateLimit(async () => {
        const response = await this.model.invoke([
          new SystemMessage(systemMessage),
          new HumanMessage(prompt)
        ]);
        return response.content as string;
      });

      this.logTokenUsage("StyleSummary", fullPrompt, result);

      return result;
    } catch (error) {
      console.error("Error generating style summary:", error);
      return "Unable to analyze communication style from historical data.";
    }
  }

  /**
   * NEW: Analyze incoming email to determine context needs
   */
  async invokeIncomingScanner(emailData: {
    from: string;
    to: string[];
    subject: string;
    body: string;
    date: Date;
  }): Promise<IncomingEmailScannerOutput> {
    try {
      console.log('🔍 Analyzing incoming email for context needs...');

      const scannerPrompt = readPromptFile('incomingEmailScannerPrompt.md');

      // Format the prompt with email data
      const formattedPrompt = scannerPrompt
        .replace('{fromEmail}', emailData.from)
        .replace('{toEmails}', emailData.to.join(', '))
        .replace('{subject}', emailData.subject)
        .replace('{emailDate}', emailData.date.toISOString())
        .replace('{emailBody}', emailData.body);

      const systemMessage = "You are an intelligent email analysis system that determines what contextual information is needed for accurate replies.";
      const fullPrompt = systemMessage + "\n\n" + formattedPrompt;
      this.logTokenUsage("IncomingScanner", fullPrompt);

      const responseText = await this.executeWithRateLimit(async () => {
        const response = await this.model.invoke([
          new SystemMessage(systemMessage),
          new HumanMessage(formattedPrompt)
        ]);
        return response.content as string;
      });
      
      // Parse JSON response
      this.logTokenUsage("IncomingScanner", fullPrompt, responseText);
      
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
      const scannerOutput = JSON.parse(cleanedResponse) as IncomingEmailScannerOutput;
      
      console.log(`✅ Email scanned - Intent: ${scannerOutput.primaryIntent}, Urgency: ${scannerOutput.urgencyLevel}, Calendar needed: ${scannerOutput.needsCalendarCheck}`);
      
      return scannerOutput;
    } catch (error) {
      console.error('❌ Error in incoming email scanner:', error);
      // Return fallback analysis
      return {
        needsCalendarCheck: false,
        emailContextQuery: {
          keywords: emailData.subject.split(' ').slice(0, 3).filter(word => word.length > 2),
          senderFilter: [emailData.from],
          dateWindowHint: 'recent',
          hasAttachment: false,
          maxResults: 10
        },
        urgencyLevel: 'medium',
        primaryIntent: 'other',
        reasoning: 'Fallback analysis due to scanner error'
      };
    }
  }

  /**
   * NEW: Compress detailed style analysis into efficient style guide with examples
   */
  async invokeStyleCompressor(
    masterPrompt: string,
    detailedStyleAnalysis: string,
    historicalEmails: Array<{
      from: string;
      to: string[];
      subject: string;
      body: string;
      date: Date;
      isSent: boolean;
    }>
  ): Promise<string> {
    try {
      console.log('✂️ Compressing style analysis into efficient guide...');

      const styleCompressorPrompt = readPromptFile('styleCompressorPrompt.md');

      // Format historical emails for compression
      const emailExamples = historicalEmails
        .slice(0, 5) // Use only top 5 emails as examples
        .map(email => `From: ${email.from}\nTo: ${email.to.join(', ')}\nSubject: ${email.subject}\nBody: ${email.body.substring(0, 200)}...`)
        .join('\n---\n');

      // Format the prompt with all style data
      const formattedPrompt = styleCompressorPrompt
        .replace('{masterPrompt}', masterPrompt)
        .replace('{detailedStyleAnalysis}', detailedStyleAnalysis)
        .replace('{historicalEmails}', emailExamples);

      const systemMessage = "You are a Style Compressor that creates highly efficient style guides with concrete examples while preserving the user's unique voice patterns.";
      const fullPrompt = systemMessage + "\n\n" + formattedPrompt;
      this.logTokenUsage("StyleCompressor", fullPrompt);

      const compressedStyleGuide = await this.executeWithRateLimit(async () => {
        const response = await this.model.invoke([
          new SystemMessage(systemMessage),
          new HumanMessage(formattedPrompt)
        ]);
        return response.content as string;
      });
      
      this.logTokenUsage("StyleCompressor", fullPrompt, compressedStyleGuide);
      
      console.log(`✅ Style compressed into efficient guide (${compressedStyleGuide.length} characters)`);
      
      return compressedStyleGuide;
    } catch (error) {
      console.error('❌ Error in style compressor:', error);
      // Return fallback compressed style
      return `CORE STYLE PATTERNS:
• Professional, concise communication style
• Uses standard email greetings and closings

KEY EXAMPLES:
1. Basic response: "Thanks for reaching out. I'll review and get back to you."
2. Confirmation: "Sounds good, I'm available at that time."
3. Follow-up: "Just checking in on the status of our previous discussion."

SENDER ADAPTATION:
• Match the sender's level of formality
• Respond in similar tone and structure

CRITICAL NOTES:
• Style analysis failed - using generic patterns
• Maintain professional, helpful tone`;
    }
  }

  /**
   * Synthesize raw contextual information into actionable reply instructions
   */
  async invokeContextSynthesizer(
    originalEmail: {
      from: string;
      to: string[];
      subject: string;
      body: string;
      date: Date;
    },
    rawContextualInfo: string,
    interactionNetwork: object,
    strategicRulebook: object
  ): Promise<string> {
    try {
      console.log('🧠 Synthesizing context into reply instructions...');

      const synthesizerPrompt = readPromptFile('contextSynthesizerPrompt.md');

      // Format the prompt with email and context data
      const formattedPrompt = synthesizerPrompt
        .replace('{fromEmail}', originalEmail.from)
        .replace('{toEmails}', originalEmail.to.join(', '))
        .replace('{subject}', originalEmail.subject)
        .replace('{emailDate}', originalEmail.date.toISOString())
        .replace('{emailBody}', originalEmail.body)
        .replace('{rawContextualInfo}', rawContextualInfo)
        .replace('{interactionNetwork}', JSON.stringify(interactionNetwork, null, 2))
        .replace('{strategicRulebook}', JSON.stringify(strategicRulebook, null, 2));

      const systemMessage = "You are a Context Synthesizer that creates intelligent reply instructions from comprehensive contextual information.";
      const fullPrompt = systemMessage + "\n\n" + formattedPrompt;
      this.logTokenUsage("ContextSynthesizer", fullPrompt);

      const replyInstructions = await this.executeWithRateLimit(async () => {
        const response = await this.model.invoke([
          new SystemMessage(systemMessage),
          new HumanMessage(formattedPrompt)
        ]);
        return response.content as string;
      });
      
      this.logTokenUsage("ContextSynthesizer", fullPrompt, replyInstructions);
      
      console.log(`✅ Context synthesized into reply instructions (${replyInstructions.length} characters)`);
      
      return replyInstructions;
    } catch (error) {
      console.error('❌ Error in context synthesizer:', error);
      // Return fallback instructions
      return `PRIMARY RESPONSE REQUIREMENTS:
- Respond to "${originalEmail.subject}" from ${originalEmail.from}
- Address the main points in their email

STRATEGIC OVERLAY:
- No strategic overlay available due to processing error.

KEY CONTEXTUAL INSIGHTS TO INCLUDE:
- Limited context available due to processing error

SUGGESTED RESPONSE STRUCTURE:
1. Acknowledge their email
2. Provide direct response to their request
3. Offer next steps if appropriate

SPECIFIC DETAILS TO MENTION:
- None available due to context processing error

RECOMMENDED ACTIONS/NEXT STEPS:
- Follow up as needed based on their request

RELATIONSHIP CONSIDERATIONS:
- Use professional, helpful tone

CONFIDENCE ASSESSMENT:
Low - Context synthesis failed, using minimal response strategy`;
    }
  }

  /**
   * Generate raw contextual information from all gathered data
   */
  async invokeFinalToolContextGenerator(
    originalEmail: {
      from: string;
      to: string[];
      subject: string;
      body: string;
      date: Date;
    },
    scannerOutput: IncomingEmailScannerOutput,
    calendarContext: string,
    directEmailHistory: string,
    keywordEmailContext: string
  ): Promise<string> {
    try {
      console.log('🔧 Generating raw contextual information...');

      const contextPrompt = readPromptFile('finalToolContextGeneratorPrompt.md');

      // Format the prompt with all context data
      const formattedPrompt = contextPrompt
        .replace('{fromEmail}', originalEmail.from)
        .replace('{toEmails}', originalEmail.to.join(', '))
        .replace('{subject}', originalEmail.subject)
        .replace('{emailDate}', originalEmail.date.toISOString())
        .replace('{emailBody}', originalEmail.body)
        .replace('{primaryIntent}', scannerOutput.primaryIntent)
        .replace('{urgencyLevel}', scannerOutput.urgencyLevel)
        .replace('{scannerReasoning}', scannerOutput.reasoning)
        .replace('{calendarContext}', calendarContext)
        .replace('{directEmailHistory}', directEmailHistory)
        .replace('{keywordEmailContext}', keywordEmailContext);

      const systemMessage = "You are a Contextual Information Compressor that extracts and compresses relevant information into highly efficient, structured formats while preserving all critical details.";
      const fullPrompt = systemMessage + "\n\n" + formattedPrompt;
      this.logTokenUsage("FinalToolContextGenerator", fullPrompt);

      const rawContextInfo = await this.executeWithRateLimit(async () => {
        const response = await this.liteModel.invoke([
          new SystemMessage(systemMessage),
          new HumanMessage(formattedPrompt)
        ]);
        return response.content as string;
      });
      
      // Return raw text response (no JSON parsing needed)
      this.logTokenUsage("FinalToolContextGenerator", fullPrompt, rawContextInfo);
      
      console.log(`✅ Raw contextual information generated (${rawContextInfo.length} characters)`);
      
      return rawContextInfo;
    } catch (error) {
      console.error('❌ Error in final context generator:', error);
      // Return fallback context in new compressed format
      return `CRITICAL FACTS:
• Email from ${originalEmail.from} regarding "${originalEmail.subject}"
• Requires response - context analysis failed

COMMUNICATION PATTERN:
• Unknown due to processing error

RECENT CONTEXT:
• Limited data available

CALENDAR IMPACT:
• ${calendarContext || 'No calendar info available'}

BROADER CONTEXT:
• Processing error - minimal context

KEY REFERENCES:
• Subject: ${originalEmail.subject}

RESPONSE GUIDANCE:
• Acknowledge and provide helpful response
• Request clarification if needed`;
    }
  }

  /**
   * Enhanced reply generation that can work with contextual drafts
   */
  async generateReply(
    masterPrompt: string,
    emailContext: EmailContext,
    styleSummary?: string,
    contextualDraft?: string
  ): Promise<ReplyGenerationResult> {
    console.log("🤖 Starting LLM reply generation...");
    
    const replyGenerationPrompt = PromptTemplate.fromTemplate(getReplyGenerationPrompt());
    console.log("📝 Loaded reply generation prompt template");

    const styleContext = styleSummary 
      ? `Communication Style Analysis:\n${styleSummary}\n`
      : "No previous communication history available.\n";
    


    try {
      console.log("🔧 Formatting prompt with variables...");
      const prompt = await replyGenerationPrompt.format({
        masterPrompt,
        fromEmail: emailContext.incomingEmail.from,
        toEmails: emailContext.incomingEmail.to.join(', '),
        subject: emailContext.incomingEmail.subject,
        emailBody: emailContext.incomingEmail.body,
        emailDate: emailContext.incomingEmail.date.toISOString(),
        styleContext,
        contextualDraftInput: contextualDraft || ''
      });

      console.log("📤 Sending request to Gemini LLM...");
      console.log("🔑 API Key exists:", !!process.env.GOOGLE_API_KEY);

      const systemMessage = "You are an expert email assistant that generates professional, contextually appropriate email replies.";
      const fullPrompt = systemMessage + "\n\n" + prompt;
      this.logTokenUsage("GenerateReply", fullPrompt);

      const responseText = await this.executeWithRateLimit(async () => {
        const response = await this.model.invoke([
          new SystemMessage(systemMessage),
          new HumanMessage(prompt)
        ]);
        return response.content as string;
      });

      console.log("📥 Received response from LLM");
      this.logTokenUsage("GenerateReply", fullPrompt, responseText);
      console.log("🔍 Response preview:", responseText.substring(0, 200) + "...");

      const parsedResult = this.parseReplyResponse(responseText);
      console.log("✅ Successfully parsed LLM response");
      console.log("💯 Confidence score:", parsedResult.confidence);
      
      return parsedResult;
    } catch (error) {
      console.error("❌ Error generating reply:", error);
      console.error("🔍 Error details:", error instanceof Error ? error.message : 'Unknown error');
      console.error("📊 Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      return {
        reply: "I apologize, but I'm unable to generate a reply at this time. Please try again later.",
        confidence: 0,
        reasoning: "Error occurred during reply generation"
      };
    }
  }

  /**
   * Parses the LLM response to extract reply, confidence, and reasoning
   */
  private parseReplyResponse(response: string): ReplyGenerationResult {
    try {
      const replyMatch = response.match(/REPLY:\s*([\s\S]*?)(?=CONFIDENCE:|$)/);
      const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/);
      const reasoningMatch = response.match(/REASONING:\s*([\s\S]*?)$/);

      const reply = replyMatch?.[1]?.trim() || response;
      const confidence = confidenceMatch?.[1] ? parseInt(confidenceMatch[1]) : 50;
      const reasoning = reasoningMatch?.[1]?.trim() || "Standard reply generation";

      return {
        reply,
        confidence: Math.min(Math.max(confidence, 0), 100), // Clamp between 0-100
        reasoning
      };
    } catch (error) {
      console.error("Error parsing reply response:", error);
      return {
        reply: response,
        confidence: 50,
        reasoning: "Unable to parse response format"
      };
    }
  }
} 