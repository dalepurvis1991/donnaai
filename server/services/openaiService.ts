import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIService {
  async generateStructuredResponse(prompt: string, context: string = "general"): Promise<string> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert AI assistant analyzing business emails for task and job tracking. 
Context: ${context}
Always respond with valid JSON format.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 1000,
      });

      return response.choices[0].message.content || "{}";
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI service error: ${error.message}`);
    }
  }

  async generateDraftReply(subject: string, body: string, sender: string, businessContext: string = ""): Promise<{
    reply: string;
    confidence: number;
    tone: "professional" | "casual" | "formal";
    reasoning: string;
  }> {
    try {
      const prompt = `Generate a professional email reply based on the original email and business context.

Original Email:
Subject: ${subject}
From: ${sender}
Body: ${body}

Business Context: ${businessContext}

Generate a reply that:
- Acknowledges the email appropriately
- Addresses any questions or requests
- Maintains professional tone
- Uses business context for personalization

Respond with JSON containing:
- reply: the email body text
- confidence: percentage (0-100) based on context quality
- tone: "professional", "casual", or "formal"  
- reasoning: brief explanation of approach`;

      const response = await this.generateStructuredResponse(prompt, "email_drafting");
      const result = JSON.parse(response);
      
      return {
        reply: result.reply || "Thank you for your email. I'll review the details and get back to you shortly.\n\nBest regards",
        confidence: Math.max(70, result.confidence || 80), // Minimum 70% confidence with business context
        tone: result.tone || "professional",
        reasoning: result.reasoning || "Professional acknowledgment with business context integration"
      };
    } catch (error) {
      console.error("Draft generation error:", error);
      return {
        reply: "Thank you for your email. I'll review the details and get back to you shortly.\n\nBest regards",
        confidence: 75,
        tone: "professional",
        reasoning: "Fallback professional response"
      };
    }
  }

  async categorizeEmail(subject: string, body: string, sender: string, senderEmail: string): Promise<{ category: string; confidence: number; reasoning: string }> {
    try {
      const prompt = `Analyze this email and categorize it into one of three categories:
      
      Categories:
      - FYI: Informational emails that don't require action (newsletters, updates, notifications)
      - Draft: Emails requiring action, response, or follow-up (questions, requests, meetings)
      - Forward: Emails that should be shared with team/others (important announcements, team updates)
      
      Email Details:
      Subject: ${subject}
      From: ${sender} (${senderEmail})
      Body: ${body.substring(0, 500)}
      
      Respond with JSON containing:
      - category: one of "FYI", "Draft", "Forward"
      - confidence: percentage (0-100)
      - reasoning: brief explanation`;

      const response = await this.generateStructuredResponse(prompt, "email_categorization");
      const result = JSON.parse(response);
      
      return {
        category: result.category || "FYI",
        confidence: result.confidence || 75,
        reasoning: result.reasoning || "Default categorization"
      };
    } catch (error) {
      console.error("Email categorization error:", error);
      return {
        category: "FYI",
        confidence: 50,
        reasoning: "Fallback categorization due to AI error"
      };
    }
  }

  async generateChatResponse(messages: any[], systemPrompt?: string): Promise<string> {
    try {
      // Ensure messages is an array and properly formatted
      const messageArray = Array.isArray(messages) ? messages : [{ role: "user", content: String(messages) }];
      
      const chatMessages = [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        ...messageArray
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1500,
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("OpenAI chat error:", error);
      throw new Error(`Chat service error: ${error.message}`);
    }
  }

  async summarizeText(text: string, maxLength: number = 150): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `Summarize this text in ${maxLength} characters or less, focusing on key business information:\n\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      return response.choices[0].message.content || text.substring(0, maxLength);
    } catch (error) {
      console.error("OpenAI summarization error:", error);
      return text.substring(0, maxLength); // Fallback to simple truncation
    }
  }

  async analyzeSentiment(text: string): Promise<{
    sentiment: "positive" | "negative" | "neutral";
    confidence: number;
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze the sentiment of business emails. Respond with JSON in this format:
            {
              "sentiment": "positive|negative|neutral",
              "confidence": number between 0 and 1
            }`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 100,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        sentiment: result.sentiment || "neutral",
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      };
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      return { sentiment: "neutral", confidence: 0.5 };
    }
  }
}

export const openaiService = new OpenAIService();