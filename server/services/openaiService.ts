import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface EmailCategorizationResult {
  category: "FYI" | "Draft" | "Forward";
  confidence: number;
  reasoning: string;
}

export class OpenAIService {
  async categorizeEmail(subject: string, body: string, sender: string, senderEmail: string): Promise<EmailCategorizationResult> {
    try {
      const prompt = `You are an intelligent email assistant that categorizes emails into three categories:

1. **FYI** - Informational emails that require no action (newsletters, notifications, confirmations, updates, receipts, automated messages)
2. **Draft** - Emails that need action or response from the user (questions, requests, tasks, important decisions, urgent matters)
3. **Forward** - Emails that should be delegated or shared with others (customer inquiries, team coordination, external requests)

Analyze this email and categorize it:

Subject: ${subject}
Sender: ${sender} (${senderEmail})
Body: ${body.substring(0, 2000)}...

Respond with JSON in this exact format:
{
  "category": "FYI|Draft|Forward",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category was chosen"
}

Consider:
- Automated emails (receipts, notifications) → FYI
- Personal requests/questions → Draft
- Customer service inquiries → Forward
- Newsletters/updates → FYI
- Action items/tasks → Draft
- External business communications → Forward`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert email categorization assistant. Always respond with valid JSON in the exact format requested."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and sanitize the response
      if (!result.category || !['FYI', 'Draft', 'Forward'].includes(result.category)) {
        throw new Error('Invalid category returned from OpenAI');
      }

      return {
        category: result.category,
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        reasoning: result.reasoning || 'No reasoning provided'
      };

    } catch (error) {
      console.error('OpenAI categorization error:', error);
      
      // Fallback to basic rule-based categorization
      return this.basicCategorization(subject, body, sender, senderEmail);
    }
  }

  private basicCategorization(subject: string, body: string, sender: string, senderEmail: string): EmailCategorizationResult {
    const subjectLower = subject.toLowerCase();
    const bodyLower = body.toLowerCase();
    const senderLower = sender.toLowerCase();
    
    // FYI indicators
    const fyiKeywords = ['newsletter', 'notification', 'receipt', 'confirmation', 'update', 'automated', 'noreply', 'no-reply'];
    const fyiSenders = ['google', 'microsoft', 'apple', 'amazon', 'paypal', 'stripe', 'trustpilot'];
    
    // Draft indicators (needs action)
    const draftKeywords = ['urgent', 'asap', 'action required', 'please', 'request', 'question', 'review', 'approval'];
    
    // Forward indicators (delegate/share)
    const forwardKeywords = ['customer', 'client', 'support', 'inquiry', 'complaint', 'feedback'];
    
    // Check FYI
    if (fyiKeywords.some(kw => subjectLower.includes(kw) || bodyLower.includes(kw)) ||
        fyiSenders.some(sender => senderLower.includes(sender))) {
      return {
        category: "FYI",
        confidence: 0.7,
        reasoning: "Appears to be informational/automated email"
      };
    }
    
    // Check Forward
    if (forwardKeywords.some(kw => subjectLower.includes(kw) || bodyLower.includes(kw))) {
      return {
        category: "Forward",
        confidence: 0.6,
        reasoning: "Appears to be customer/external communication"
      };
    }
    
    // Check Draft
    if (draftKeywords.some(kw => subjectLower.includes(kw) || bodyLower.includes(kw))) {
      return {
        category: "Draft",
        confidence: 0.6,
        reasoning: "Appears to require action or response"
      };
    }
    
    // Default to Draft for unknown emails
    return {
      category: "Draft",
      confidence: 0.4,
      reasoning: "Default categorization - requires review"
    };
  }
}

export const openaiService = new OpenAIService();