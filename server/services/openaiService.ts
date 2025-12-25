import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// OpenAI client is initialized lazily in the service


// Schemas for Structured Outputs
export const CategorizationSchema = z.object({
  category: z.enum(["FYI", "Draft", "Forward"]),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
});

export const TaskDetectionSchema = z.object({
  isTask: z.boolean(),
  confidence: z.number().min(0).max(1),
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  supplier: z.string().optional(),
  amount: z.number().optional(),
  orderNumber: z.string().optional(),
  stages: z.array(z.object({
    stage: z.string(),
    completed: z.boolean()
  })).optional(),
  reasoning: z.string()
});

export const TaskUpdateSchema = z.object({
  hasUpdate: z.boolean(),
  confidence: z.number(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  stages: z.array(z.object({
    stage: z.string(),
    completed: z.boolean(),
    completedAt: z.string().optional(),
    emailId: z.number().optional()
  })),
  orderNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  amount: z.number().optional(),
  completedAt: z.string().optional(),
  reasoning: z.string()
});

export const SentimentSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  confidence: z.number().min(0).max(1),
});

export const DraftReplySchema = z.object({
  reply: z.string(),
  confidence: z.number().min(0).max(100),
  tone: z.enum(["professional", "casual", "formal"]),
  reasoning: z.string(),
});

export const QuoteAnalysisSchema = z.object({
  bestOption: z.object({
    vendor: z.string(),
    price: z.number(),
    reason: z.string()
  }),
  comparison: z.object({
    priceRange: z.object({ min: z.number(), max: z.number() }),
    vendors: z.array(z.object({
      name: z.string(),
      price: z.number(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      deliveryTime: z.string().optional(),
      warranty: z.string().optional()
    }))
  }),
  recommendation: z.string()
});

export const OrderTimelineSchema = z.object({
  orderStatus: z.enum(["pending", "confirmed", "shipped", "delivered", "completed"]),
  timeline: z.array(z.object({
    date: z.string(),
    event: z.string(),
    details: z.string()
  })),
  nextAction: z.string(),
  totalValue: z.number().optional()
});

export const CorrelationSchema = z.object({
  correlations: z.array(z.object({
    relatedEmailId: z.number(),
    correlationType: z.enum(["quote", "invoice", "order", "inquiry", "response"]),
    subject: z.string(),
    confidence: z.number().min(0).max(1),
    metadata: z.object({
      price: z.number().optional(),
      vendor: z.string().optional(),
      product: z.string().optional(),
      notes: z.string().optional()
    })
  }))
});

export class OpenAIService {
  private _client: OpenAI | null = null;

  private get client(): OpenAI {
    if (!this._client) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY environment variable is not set");
      }
      this._client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return this._client;
  }

  async generateStructuredResponse<T>(
    prompt: string,
    context: string,
    format: { type: string, zodSchema: z.ZodType<T>, name: string }
  ): Promise<T> {
    try {
      const response = await this.client.beta.chat.completions.parse({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert AI assistant analyzing business emails. Context: ${context}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: zodResponseFormat(format.zodSchema, format.name),
        temperature: 0.3,
      });

      const message = response.choices[0].message;
      if (message.parsed) {
        return message.parsed;
      } else {
        throw new Error("Refused to generate structured output");
      }
    } catch (error: any) {
      console.error("OpenAI Structured Output error:", error);
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
- Uses business context for personalization`;

      return await this.generateStructuredResponse(prompt, "email_drafting", {
        type: "json_schema",
        zodSchema: DraftReplySchema,
        name: "draft_reply"
      });
    } catch (error) {
      console.error("Draft generation error:", error);
      return {
        reply: "Thank you for your email. I'll review the details and get back to you shortly.\n\nBest regards",
        confidence: 75,
        tone: "professional",
        reasoning: "Fallback professional response due to error"
      };
    }
  }

  async categorizeEmail(subject: string, body: string, sender: string, senderEmail: string): Promise<{ category: string; confidence: number; reasoning: string }> {
    try {
      const prompt = `Analyze this email and categorize it.
      
      Categories:
      - FYI: Informational emails that don't require action (newsletters, updates, notifications)
      - Draft: Emails requiring action, response, or follow-up (questions, requests, meetings)
      - Forward: Emails that should be shared with team/others (important announcements, team updates)
      
      Email Details:
      Subject: ${subject}
      From: ${sender} (${senderEmail})
      Body: ${body.substring(0, 500)}`;

      return await this.generateStructuredResponse(prompt, "email_categorization", {
        type: "json_schema",
        zodSchema: CategorizationSchema,
        name: "categorization"
      });
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
      const messageArray = Array.isArray(messages) ? messages : [{ role: "user", content: String(messages) }];

      const chatMessages = [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        ...messageArray
      ];

      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1500,
      });

      return response.choices[0].message.content || "";
    } catch (error: any) {
      console.error("OpenAI chat error:", error);
      throw new Error(`Chat service error: ${error.message}`);
    }
  }

  async summarizeText(text: string, maxLength: number = 150): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
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
      return text.substring(0, maxLength);
    }
  }

  async analyzeSentiment(text: string): Promise<{
    sentiment: "positive" | "negative" | "neutral";
    confidence: number;
  }> {
    try {
      return await this.generateStructuredResponse(text, "sentiment_analysis", {
        type: "json_schema",
        zodSchema: SentimentSchema,
        name: "sentiment"
      });
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      return { sentiment: "neutral", confidence: 0.5 };
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: "text-embedding-3-small",
        input: text.replace(/\n/g, " "),
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  }
}

export const openaiService = new OpenAIService();
