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
        recentEmails: recentEmails.slice(0, 50), // More emails for better context
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
      // Check if this is a folder management request
      const folderAction = await this.detectFolderAction(message);
      if (folderAction) {
        return await this.handleFolderAction(userId, folderAction, message);
      }

      const context = await this.buildContext(userId);
      
      // Use vector service to find relevant memories
      const { vectorService } = await import("./vectorService");
      const relevantMemories = await vectorService.searchMemories(message, userId, 10);
      
      // Enhanced system prompt with folder capabilities
      const systemPrompt = `You are Donna AI, an intelligent email management assistant with deep business context awareness and folder management capabilities.

BUSINESS CONTEXT (from ${context.recentEmails.length} emails):
- Email volume: ${context.recentEmails.length} recent emails analyzed
- Category distribution: FYI (${context.emailPatterns.categoryDistribution.FYI || 0}), Draft (${context.emailPatterns.categoryDistribution.Draft || 0}), Forward (${context.emailPatterns.categoryDistribution.Forward || 0})
- Key business contacts: ${context.emailPatterns.commonSenders.slice(0, 8).join(", ")}
- Common subjects: ${context.emailPatterns.commonSubjects.slice(0, 5).join(", ")}
- User communication style: ${this.inferCommunicationStyle(context.recentEmails)}

RELEVANT MEMORIES (${relevantMemories.length} found):
${relevantMemories.map(m => `- ${m.document.text.substring(0, 150)}... (Score: ${Math.round(m.score * 100)}%)`).join("\n")}

ADVANCED CAPABILITIES:
✓ Create and manage email folders with automatic rules
✓ Analyze business relationships from email patterns  
✓ Generate contextually appropriate responses based on communication style
✓ Learn from email history to improve suggestions over time
✓ Understand business context and priorities

FOLDER MANAGEMENT:
To create folders, say things like:
- "Create a folder for sales emails from floorgiants.co.uk"
- "Put all emails from [sender] in a folder called [name]"
- "Organize emails by subject containing [keyword]"

Recent Email Insights:
${context.recentEmails.slice(0, 5).map(email => 
  `- ${email.subject} from ${email.sender} (${email.category}) - ${this.getEmailInsight(email)}`
).join('\n')}

Be helpful, contextually aware, and provide actionable insights. Reference specific emails or patterns when relevant.`;

      const response = await openaiService.generateChatResponse(systemPrompt, message);
      return response;
    } catch (error) {
      console.error("Error processing user message:", error);
      return "I'm having trouble accessing your email data right now. Please try again in a moment.";
    }
  }

  private async detectFolderAction(message: string): Promise<any | null> {
    const lowerMessage = message.toLowerCase();
    
    // Detect folder creation requests
    if (lowerMessage.includes("create") && (lowerMessage.includes("folder") || lowerMessage.includes("put all emails"))) {
      // Extract sender email or domain
      const senderMatch = message.match(/from\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      const domainMatch = message.match(/from\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      
      if (senderMatch || domainMatch) {
        return {
          action: "create_folder_with_rule",
          senderEmail: senderMatch ? senderMatch[1] : null,
          domain: domainMatch && !senderMatch ? domainMatch[1] : null,
          originalMessage: message
        };
      }
    }
    
    return null;
  }

  private async handleFolderAction(userId: string, action: any, originalMessage: string): Promise<string> {
    try {
      const { storage } = await import("../storage");
      
      if (action.action === "create_folder_with_rule") {
        // Create a meaningful folder name
        let folderName = "Unnamed Folder";
        let ruleType = "sender";
        let ruleValue = "";
        
        if (action.senderEmail) {
          const domain = action.senderEmail.split("@")[1];
          folderName = `${domain} Emails`;
          ruleType = "sender";
          ruleValue = action.senderEmail;
        } else if (action.domain) {
          folderName = `${action.domain} Emails`;
          ruleType = "domain";
          ruleValue = action.domain;
        }
        
        // Create the folder
        const folder = await storage.createFolder(userId, folderName, "#10b981", `Auto-created folder for emails from ${ruleValue}`);
        
        // Create the rule
        await storage.createFolderRule(userId, folder.id, ruleType, ruleValue);
        
        // Apply rules to existing emails
        const emails = await storage.getEmails();
        for (const email of emails) {
          await storage.applyFolderRules(email.id, userId);
        }
        
        // Count affected emails
        const folderEmails = await storage.getEmailsByFolder(folder.id);
        
        return `✅ Created folder "${folderName}" and automatically moved ${folderEmails.length} existing emails into it. All future emails from ${ruleValue} will be automatically organized into this folder.

The folder has been set up with:
- Name: ${folderName}
- Rule: All emails from ${ruleValue}
- Color: Green
- ${folderEmails.length} emails already organized

You can view your folders and manage rules in the folders section.`;
      }
      
      return "I couldn't complete that folder action. Please try rephrasing your request.";
    } catch (error) {
      console.error("Error handling folder action:", error);
      return "There was an error creating the folder. Please check the folder name and try again.";
    }
  }

  private inferCommunicationStyle(emails: any[]): string {
    if (emails.length === 0) return "professional";
    
    // Analyze email content for tone indicators
    const businessKeywords = ["meeting", "project", "deadline", "client", "customer", "proposal"];
    const casualKeywords = ["thanks", "cheers", "hope", "please", "kind regards"];
    const formalKeywords = ["sincerely", "respectfully", "dear", "pursuant", "aforementioned"];
    
    let businessScore = 0;
    let casualScore = 0;
    let formalScore = 0;
    
    for (const email of emails.slice(0, 10)) {
      const content = (email.subject + " " + (email.body || "")).toLowerCase();
      
      businessKeywords.forEach(word => {
        if (content.includes(word)) businessScore++;
      });
      casualKeywords.forEach(word => {
        if (content.includes(word)) casualScore++;
      });
      formalKeywords.forEach(word => {
        if (content.includes(word)) formalScore++;
      });
    }
    
    if (formalScore > businessScore && formalScore > casualScore) return "formal";
    if (casualScore > businessScore && casualScore > formalScore) return "casual";
    return "professional";
  }

  private getEmailInsight(email: any): string {
    // Generate quick insights about emails
    if (email.category === "Draft" && email.senderEmail.includes("sales")) {
      return "Likely requires response to sales inquiry";
    }
    if (email.category === "FYI" && email.subject.toLowerCase().includes("meeting")) {
      return "Meeting information for reference";
    }
    if (email.category === "Forward" && email.subject.toLowerCase().includes("urgent")) {
      return "Urgent matter to share with team";
    }
    return `${email.category} email requiring attention`;
  }
}

export const ragService = new RAGService();