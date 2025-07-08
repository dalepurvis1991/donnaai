import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class OpenAIService {
  async generateChatResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw error;
    }
  }

  async generateJSONResponse(systemPrompt: string, userPrompt: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || "{}";
      return JSON.parse(content);
    } catch (error) {
      console.error("OpenAI JSON API error:", error);
      throw error;
    }
  }

  async analyzeEmail(subject: string, body: string, senderEmail: string): Promise<{
    category: string;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const systemPrompt = `You are an expert email categorization system. Analyze emails and categorize them into exactly one of these categories:
- FYI: Informational emails that don't require action
- Draft: Emails requiring action or response  
- Forward: Emails that should be shared with others

Return JSON format with category, confidence (0-1), and brief reasoning.`;

      const userPrompt = `Subject: ${subject}
From: ${senderEmail}
Body: ${body?.substring(0, 500) || "No body content"}

Categorize this email and explain your reasoning.`;

      const result = await this.generateJSONResponse(systemPrompt, userPrompt);
      
      return {
        category: result.category || "FYI",
        confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
        reasoning: result.reasoning || "Automated categorization"
      };
    } catch (error) {
      console.error("Error analyzing email:", error);
      return {
        category: "FYI",
        confidence: 0.3,
        reasoning: "Default categorization due to analysis error"
      };
    }
  }
}

export const openaiService = new OpenAIService();