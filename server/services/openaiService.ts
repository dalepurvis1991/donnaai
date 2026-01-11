import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// OpenAI client is initialized lazily in the service


// Schemas for Structured Outputs
export const CategorizationSchema = z.object({
  category: z.string(),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
});

export const TriageSchema = z.object({
  intent: z.string().optional(),
  entities: z.object({
    customer: z.string().optional(),
    orderRef: z.string().optional(),
    sku: z.string().optional(),
    amount: z.number().optional(),
    deadline: z.string().optional(),
    riskFlags: z.array(z.string()).optional(),
  }).optional(),
  confidence: z.number().min(0).max(1),
  classification: z.object({
    category: z.string(),
    urgency: z.enum(["now", "today", "this_week", "later"]),
    impact: z.enum(["high", "medium", "low"]),
  }),
  reasoning: z.string(),
});

export const TaskDetectionSchema = z.object({
  isTask: z.boolean(),
  confidence: z.number().min(0).max(1),
  title: z.string().nullable(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).nullable(),
  supplier: z.string().nullable(),
  amount: z.number().nullable(),
  orderNumber: z.string().nullable(),
  stages: z.array(z.object({
    stage: z.string(),
    completed: z.boolean()
  })).nullable(),
  reasoning: z.string(),
  // Enhanced MVP fields
  brief: z.object({
    whatHappened: z.string(),
    whatNeedsDoing: z.string(),
    constraints: z.string().nullable(),
    suggestedNextStep: z.string().nullable()
  }).nullable(),
  evidence: z.object({
    quote: z.string(),
    offsets: z.object({ start: z.number(), end: z.number() }).nullable()
  }).nullable(),
  entities: z.object({
    people: z.array(z.string()).nullable(),
    orgs: z.array(z.string()).nullable(),
    orderRefs: z.array(z.string()).nullable(),
    amounts: z.array(z.number()).nullable(),
    dates: z.array(z.string()).nullable()
  }).nullable(),
  owner: z.enum(["me", "contact", "unknown"]).nullable(),
  dueDate: z.string().nullable()
});

export const TaskUpdateSchema = z.object({
  hasUpdate: z.boolean(),
  confidence: z.number(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  stages: z.array(z.object({
    stage: z.string(),
    completed: z.boolean(),
    completedAt: z.string().nullable(),
    emailId: z.number().nullable()
  })),
  orderNumber: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  amount: z.number().nullable(),
  completedAt: z.string().nullable(),
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
  totalValue: z.number().nullable()
});

export const CorrelationSchema = z.object({
  correlations: z.array(z.object({
    relatedEmailId: z.number(),
    correlationType: z.enum(["quote", "invoice", "order", "inquiry", "response"]),
    subject: z.string(),
    confidence: z.number().min(0).max(1),
    metadata: z.object({
      price: z.number().nullable(),
      vendor: z.string().nullable(),
      product: z.string().nullable(),
      notes: z.string().nullable()
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
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert AI assistant analyzing business emails. Context: ${context}. Respond with valid JSON only.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: zodResponseFormat(format.zodSchema, format.name),
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("OpenAI returned empty response");
      }

      const parsed = JSON.parse(content);
      return format.zodSchema.parse(parsed);

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

  async categorizeEmail(
    subject: string,
    body: string,
    sender: string,
    senderEmail: string,
    categoryMapping: { draft: string; fyi: string; forward: string } = { draft: "Draft", fyi: "FYI", forward: "Forward" }
  ): Promise<{ category: string; confidence: number; reasoning: string; reasons?: string[]; method?: string }> {

    // Keyword fallback rules for when LLM fails
    const FALLBACK_RULES = {
      [categoryMapping.fyi.toLowerCase()]: ["no-reply", "noreply", "receipt", "newsletter", "unsubscribe", "notification", "alert", "automated"],
      [categoryMapping.draft.toLowerCase()]: ["urgent", "action required", "deadline", "please confirm", "asap", "respond", "waiting for", "need your"],
      [categoryMapping.forward.toLowerCase()]: ["fwd:", "please share", "for your team", "loop in", "please forward"]
    };

    const lowerSubject = subject.toLowerCase();
    const lowerBody = body.toLowerCase();
    const combinedText = `${lowerSubject} ${lowerBody}`;

    // Try keyword fallback first for obvious cases
    // Note: This logic assumes keys in FALLBACK_RULES match the desired output category logic
    // We map back to the display name

    for (const [key, keywords] of Object.entries(FALLBACK_RULES)) {
      for (const keyword of keywords) {
        if (combinedText.includes(keyword)) {
          // Find which mapping this key corresponds to
          let matchedCategory = categoryMapping.fyi;
          if (key === categoryMapping.draft.toLowerCase()) matchedCategory = categoryMapping.draft;
          if (key === categoryMapping.forward.toLowerCase()) matchedCategory = categoryMapping.forward;

          return {
            category: matchedCategory,
            confidence: 0.85,
            reasoning: `Keyword match: ${keyword}`,
            reasons: [`Matched keyword: "${keyword}"`],
            method: "fallback_keywords"
          };
        }
      }
    }

    try {
      const prompt = `Analyze this email and categorize it.
      
      Categories:
      - ${categoryMapping.fyi}: Informational emails that don't require action (newsletters, updates, notifications)
      - ${categoryMapping.draft}: Emails requiring action, response, or follow-up (questions, requests, meetings)
      - ${categoryMapping.forward}: Emails that should be shared with team/others (important announcements, team updates)
      
      Email Details:
      Subject: ${subject}
      From: ${sender} (${senderEmail})
      Body: ${body.substring(0, 500)}`;

      const result = await this.generateStructuredResponse(prompt, "email_categorization", {
        type: "json_schema",
        zodSchema: CategorizationSchema,
        name: "categorization"
      });

      return {
        ...result,
        reasons: [result.reasoning],
        method: "llm"
      };
    } catch (error) {
      console.error("Email categorization LLM error, using fallback:", error);

      // Default to FYI if no match
      return {
        category: categoryMapping.fyi,
        confidence: 0.5,
        reasoning: "Default categorization - no clear signals",
        reasons: ["No clear categorization signals found"],
        method: "fallback_default"
      };
    }
  }

  private matchKeywordCategory(text: string, rules: Record<string, string[]>): { category: string; confidence: number; matchedKeyword: string } | null {
    for (const [category, keywords] of Object.entries(rules)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return {
            category: category.toUpperCase() === "FYI" ? "FYI" : category.charAt(0).toUpperCase() + category.slice(1),
            confidence: 0.85,
            matchedKeyword: keyword
          };
        }
      }
    }
    return null;
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

  getDailyBriefingSchema() {
    return z.object({
      summary: z.string(),
      priorities: z.array(z.string()),
      questions: z.array(z.object({
        id: z.string(),
        text: z.string(),
        context: z.string(),
        proposedAction: z.string(),
        emailId: z.number().nullable()
      }))
    });
  }
}

export const openaiService = new OpenAIService();
