import { openaiService } from "./openaiService";
import { storage } from "../storage";
import { vectorService } from "./vectorService";

export interface DraftSuggestion {
  subject: string;
  body: string;
  tone: "professional" | "casual" | "friendly" | "formal";
  confidence: number;
  reasoning: string;
}

export interface ReplyContext {
  originalEmail: any;
  userPreferences: any;
  similarEmails: any[];
  conversationHistory: any[];
}

export class DraftAssistantService {
  async generateReply(emailId: number, userId: string, userInput?: string): Promise<DraftSuggestion> {
    try {
      const context = await this.buildReplyContext(emailId, userId);
      
      const prompt = this.buildReplyPrompt(context, userInput);
      
      // Generate reply using OpenAI
      const response = await openaiService.generateChatResponse(prompt, 
        userInput || "Generate a professional reply to this email"
      );

      return this.parseReplyResponse(response, context);
    } catch (error) {
      console.error("Error generating reply:", error);
      return this.generateFallbackReply(emailId);
    }
  }

  async generateEmailDraft(
    to: string, 
    subject: string, 
    context: string, 
    userId: string,
    tone: "professional" | "casual" | "friendly" | "formal" = "professional"
  ): Promise<DraftSuggestion> {
    try {
      const userPreferences = await storage.getUserSettings(userId);
      
      // Search for similar emails for context
      const similarEmails = await vectorService.searchMemories(
        `${subject} ${context}`, userId, 3
      );

      const prompt = `Generate an email draft with the following requirements:

To: ${to}
Subject: ${subject}
Context: ${context}
Tone: ${tone}

User preferences: ${JSON.stringify(userPreferences?.emailRules || {})}

Similar emails from history:
${similarEmails.map(email => 
  `Subject: ${email.document.metadata.subject}\nContent: ${email.document.text.slice(0, 200)}...`
).join('\n\n')}

Generate a well-structured email that:
1. Has an appropriate subject line
2. Uses the requested tone
3. Is relevant to the context
4. Follows professional email conventions
5. Is personalized based on user's email history

Respond in JSON format:
{
  "subject": "email subject",
  "body": "email body",
  "tone": "${tone}",
  "confidence": 0.85,
  "reasoning": "explanation of approach"
}`;

      const response = await openaiService.generateChatResponse(prompt, "Generate the email draft");
      
      try {
        const parsed = JSON.parse(response);
        return {
          subject: parsed.subject || subject,
          body: parsed.body || this.generateFallbackBody(context),
          tone: parsed.tone || tone,
          confidence: parsed.confidence || 0.7,
          reasoning: parsed.reasoning || "Generated based on context and user preferences"
        };
      } catch (parseError) {
        return this.generateFallbackDraft(to, subject, context, tone);
      }
    } catch (error) {
      console.error("Error generating email draft:", error);
      return this.generateFallbackDraft(to, subject, context, tone);
    }
  }

  async saveEmailDraft(draft: DraftSuggestion, userId: string): Promise<void> {
    try {
      // Index the draft for future reference
      await vectorService.indexNote(
        `draft-${Date.now()}`,
        `Draft Email: ${draft.subject}\n\n${draft.body}`,
        userId
      );
    } catch (error) {
      console.error("Error saving email draft:", error);
    }
  }

  private async buildReplyContext(emailId: number, userId: string): Promise<ReplyContext> {
    const originalEmail = await storage.getEmailById(emailId);
    const userPreferences = await storage.getUserSettings(userId);
    
    // Find similar emails for context
    const similarEmails = await vectorService.searchMemories(
      originalEmail.subject, userId, 3
    );

    // Get conversation history (emails from same sender)
    const allEmails = await storage.getEmails();
    const conversationHistory = allEmails
      .filter(email => email.senderEmail === originalEmail.senderEmail)
      .slice(0, 5);

    return {
      originalEmail,
      userPreferences,
      similarEmails: similarEmails.map(r => r.document),
      conversationHistory
    };
  }

  private buildReplyPrompt(context: ReplyContext, userInput?: string): string {
    return `You are helping generate a professional email reply. Here's the context:

ORIGINAL EMAIL:
From: ${context.originalEmail.sender} (${context.originalEmail.senderEmail})
Subject: ${context.originalEmail.subject}
Body: ${context.originalEmail.body}

USER PREFERENCES:
${JSON.stringify(context.userPreferences?.emailRules || {})}

CONVERSATION HISTORY:
${context.conversationHistory.map(email => 
  `Date: ${email.date}\nFrom: ${email.sender}\nSubject: ${email.subject}\n`
).join('\n')}

SIMILAR EMAILS:
${context.similarEmails.map(email => 
  `Subject: ${email.metadata.subject}\nContent: ${email.text.slice(0, 150)}...`
).join('\n\n')}

${userInput ? `USER INPUT: ${userInput}` : ''}

Generate an appropriate reply that:
1. Addresses the main points of the original email
2. Uses a professional but friendly tone
3. Is concise and actionable
4. Follows the user's communication style based on their email history

Respond in JSON format:
{
  "subject": "Re: [original subject]",
  "body": "professional reply body",
  "tone": "professional",
  "confidence": 0.90,
  "reasoning": "explanation of reply strategy"
}`;
  }

  private parseReplyResponse(response: string, context: ReplyContext): DraftSuggestion {
    try {
      const parsed = JSON.parse(response);
      return {
        subject: parsed.subject || `Re: ${context.originalEmail.subject}`,
        body: parsed.body || this.generateFallbackReplyBody(context.originalEmail),
        tone: parsed.tone || "professional",
        confidence: parsed.confidence || 0.7,
        reasoning: parsed.reasoning || "Generated reply based on email content"
      };
    } catch (error) {
      return this.generateFallbackReply(context.originalEmail.id);
    }
  }

  private generateFallbackReply(emailId: number): DraftSuggestion {
    return {
      subject: "Re: Your Email",
      body: "Thank you for your email. I'll review the details and get back to you shortly.\n\nBest regards",
      tone: "professional",
      confidence: 0.4,
      reasoning: "Fallback template - please customize as needed"
    };
  }

  private generateFallbackReplyBody(originalEmail: any): string {
    return `Hi ${originalEmail.sender.split(' ')[0]},

Thank you for your email regarding "${originalEmail.subject}".

I'll review the details and get back to you shortly.

Best regards`;
  }

  private generateFallbackDraft(to: string, subject: string, context: string, tone: string): DraftSuggestion {
    return {
      subject,
      body: `Dear ${to.split('@')[0]},

${context}

I look forward to hearing from you.

Best regards`,
      tone: tone as any,
      confidence: 0.4,
      reasoning: "Fallback template - please customize as needed"
    };
  }

  private generateFallbackBody(context: string): string {
    return `Dear Recipient,

${context}

I look forward to your response.

Best regards`;
  }
}

export const draftAssistantService = new DraftAssistantService();