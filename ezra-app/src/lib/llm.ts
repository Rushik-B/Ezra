import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import { getStyleAnalysisPrompt, getReplyGenerationPrompt, readPromptFile } from './prompts';
import { IncomingEmailScannerOutput, FinalContextOutput } from '@/types';

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

  constructor() {
    console.log("🔧 Initializing LLM Service...");
    console.log("🔑 Google API Key configured:", !!process.env.GOOGLE_API_KEY);
    
    if (!process.env.GOOGLE_API_KEY) {
      console.error("❌ GOOGLE_API_KEY environment variable is not set!");
      throw new Error("GOOGLE_API_KEY environment variable is required");
    }

    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });
    
    console.log("✅ LLM Service initialized successfully");
  }

  /**
   * Generates text based on a prompt (used for Master Prompt generation)
   */
  async generateText(prompt: string): Promise<string> {
    console.log("🤖 Starting LLM text generation...");
    console.log("📏 Prompt length:", prompt.length);

    try {
      const response = await this.model.invoke([
        new SystemMessage("You are an expert at analyzing communication patterns and generating comprehensive style guides."),
        new HumanMessage(prompt)
      ]);

      console.log("📥 Received response from LLM");
      const result = response.content as string;
      console.log("📄 Response length:", result.length);
      
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

    try {
      const response = await this.model.invoke([
        new SystemMessage("You are an AI Style Summarizer, skilled at creating concise, human-readable summaries of detailed text."),
        new HumanMessage(prompt)
      ]);
      const distilledPrompt = response.content as string;
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

    try {
      const response = await this.model.invoke([
        new SystemMessage("You are an AI Master Prompt Synchronizer, skilled at intelligently merging user feedback into structured documents."),
        new HumanMessage(prompt)
      ]);
      const updatedFullPrompt = response.content as string;
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
        emailHistory: emailHistoryText
      });

      const response = await this.model.invoke([
        new SystemMessage("You are an expert at analyzing communication styles and patterns."),
        new HumanMessage(prompt)
      ]);

      return response.content as string;
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

      const response = await this.model.invoke([
        new SystemMessage("You are an intelligent email analysis system that determines what contextual information is needed for accurate replies."),
        new HumanMessage(formattedPrompt)
      ]);
      
      // Parse JSON response
      const responseText = response.content as string;
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
   * NEW: Synthesize raw contextual information into actionable reply instructions
   */
  async invokeContextSynthesizer(
    originalEmail: {
      from: string;
      to: string[];
      subject: string;
      body: string;
      date: Date;
    },
    rawContextualInfo: string
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
        .replace('{rawContextualInfo}', rawContextualInfo);

      const response = await this.model.invoke([
        new SystemMessage("You are a Context Synthesizer that creates intelligent reply instructions from comprehensive contextual information."),
        new HumanMessage(formattedPrompt)
      ]);
      
      const replyInstructions = response.content as string;
      
      console.log(`✅ Context synthesized into reply instructions (${replyInstructions.length} characters)`);
      
      return replyInstructions;
    } catch (error) {
      console.error('❌ Error in context synthesizer:', error);
      // Return fallback instructions
      return `PRIMARY RESPONSE REQUIREMENTS:
- Respond to "${originalEmail.subject}" from ${originalEmail.from}
- Address the main points in their email

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

      const response = await this.model.invoke([
        new SystemMessage("You are a Contextual Information Compressor that extracts and compresses relevant information into highly efficient, structured formats while preserving all critical details."),
        new HumanMessage(formattedPrompt)
      ]);
      
      // Return raw text response (no JSON parsing needed)
      const rawContextInfo = response.content as string;
      
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
    
    console.log("🎨 Style context:", styleContext.substring(0, 100) + "...");

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
      console.log("📏 Prompt length:", prompt.length);

      const response = await this.model.invoke([
        new SystemMessage("You are an expert email assistant that generates professional, contextually appropriate email replies."),
        new HumanMessage(prompt)
      ]);

      console.log("📥 Received response from LLM");
      console.log("📄 Response length:", (response.content as string).length);
      console.log("🔍 Response preview:", (response.content as string).substring(0, 200) + "...");

      const parsedResult = this.parseReplyResponse(response.content as string);
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