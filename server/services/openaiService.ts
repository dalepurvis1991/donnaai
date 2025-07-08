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

  async generateChatResponse(messages: any[], systemPrompt?: string): Promise<string> {
    try {
      const chatMessages = [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        ...messages
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