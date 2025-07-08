import { openaiService } from "./openaiService";
import { storage } from "../storage";

export interface RAGContext {
  recentEmails: any[];
  userPreferences: any;
  emailPatterns: {
    commonSenders: string[];
    commonSubjects: string[];
    categoryDistribution: Record<string, number>;
  };
}

export class RAGService {
  async buildContext(userId: string): Promise<RAGContext> {
    try {
      // Get user's recent emails for context
      const recentEmails = await storage.getEmails();
      const userSettings = await storage.getUserSettings(userId);
      
      // Analyze email patterns
      const senderCounts = new Map<string, number>();
      const subjectPatterns = new Map<string, number>();
      const categoryDistribution: Record<string, number> = {
        FYI: 0,
        Draft: 0,
        Forward: 0,
      };

      recentEmails.forEach(email => {
        // Count senders
        senderCounts.set(email.senderEmail, (senderCounts.get(email.senderEmail) || 0) + 1);
        
        // Extract subject patterns
        const subjectWords = email.subject.toLowerCase().split(' ').filter(word => word.length > 3);
        subjectWords.forEach(word => {
          subjectPatterns.set(word, (subjectPatterns.get(word) || 0) + 1);
        });
        
        // Count categories
        if (categoryDistribution[email.category]) {
          categoryDistribution[email.category]++;
        }
      });

      return {
        recentEmails: recentEmails.slice(0, 10), // Last 10 emails
        userPreferences: userSettings,
        emailPatterns: {
          commonSenders: Array.from(senderCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([sender]) => sender),
          commonSubjects: Array.from(subjectPatterns.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([pattern]) => pattern),
          categoryDistribution,
        },
      };
    } catch (error) {
      console.error("Error building RAG context:", error);
      return {
        recentEmails: [],
        userPreferences: {},
        emailPatterns: {
          commonSenders: [],
          commonSubjects: [],
          categoryDistribution: { FYI: 0, Draft: 0, Forward: 0 },
        },
      };
    }
  }

  async processUserMessage(userId: string, message: string): Promise<string> {
    try {
      const context = await this.buildContext(userId);
      
      // Create a comprehensive prompt with RAG context
      const systemPrompt = `You are Baron, an intelligent email assistant with access to the user's email data and preferences.

Current Email Context:
- Total emails analyzed: ${context.recentEmails.length}
- Category distribution: ${JSON.stringify(context.emailPatterns.categoryDistribution)}
- Common senders: ${context.emailPatterns.commonSenders.join(', ')}
- User preferences: ${JSON.stringify(context.userPreferences?.emailRules?.generalPreferences || {})}

Recent Emails Summary:
${context.recentEmails.map(email => 
  `- ${email.subject} from ${email.sender} (${email.category})`
).join('\n')}

Respond to the user's message with helpful insights about their email patterns, suggestions for better organization, or direct answers to their questions. Be conversational but informative.`;

      const response = await openaiService.generateChatResponse(systemPrompt, message);
      return response;
    } catch (error) {
      console.error("Error processing user message:", error);
      return "I'm having trouble accessing your email data right now. Please try again in a moment.";
    }
  }
}

export const ragService = new RAGService();