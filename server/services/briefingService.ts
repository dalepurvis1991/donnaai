import { storage } from "../storage";
import { openaiService } from "./openaiService";
import { Email } from "@shared/schema";

export interface BriefingResult {
    summary: string;
    questions: {
        id: string;
        text: string;
        context: string;
        proposedAction: string;
        emailId?: number;
    }[];
}

export class BriefingService {
    async generateDailyBriefing(userId: string): Promise<BriefingResult> {
        try {
            // 1. Get unread/unprocessed emails
            const emails = await storage.getEmails(userId);
            const unreadEmails = emails.filter(e => !e.isRead).slice(0, 10); // Limit to 10 for briefing

            if (unreadEmails.length === 0) {
                return {
                    summary: "Your neural core is synchronized. No new urgent traces detected.",
                    questions: []
                };
            }

            // 2. Fetch user profile for context and learning protocols
            const profile = await storage.getUserProfile(userId);
            const protocols = profile?.learningProtocols || [];

            // 3. Generate summary and questions via LLM
            const emailContext = unreadEmails.map(e => ({
                id: e.id,
                from: e.sender,
                subject: e.subject,
                body: e.body?.substring(0, 300)
            }));

            const prompt = `
Generate a concise executive briefing for the following unread emails.
Also, generate 1-2 critical "Direction Questions" where the AI identifies an action but needs user confirmation.

User Style Context: ${profile?.stylePrompt || "Professional and efficient"}
Learning Protocols (Prior Feedback): ${JSON.stringify(protocols)}

Emails:
${JSON.stringify(emailContext)}

Your response MUST be a JSON object:
{
  "summary": "A 2-3 sentence summary of the latest activity",
  "questions": [
    {
      "id": "unique_str",
      "text": "The question to ask the user (e.g. 'Should I email Chris and say yes?')",
      "context": "Brief context why this is being asked",
      "proposedAction": "The draft or action you intend to take",
      "emailId": number
    }
  ]
}
`;

            const response = await openaiService.generateStructuredResponse(prompt, "daily_briefing", {
                type: "json_schema",
                zodSchema: openaiService.getDailyBriefingSchema(),
                name: "daily_briefing"
            });

            return response;
        } catch (error) {
            console.error("Error generating daily briefing:", error);
            return {
                summary: `Error synchronizing briefing protocols: ${(error as Error).message}`,
                questions: []
            };
        }
    }

    async handleUserFeedback(userId: string, trigger: string, correction: string): Promise<void> {
        try {
            const profile = await storage.getUserProfile(userId);
            if (!profile) return;

            const protocols = profile.learningProtocols || [];
            protocols.push({
                trigger,
                correction,
                updatedAt: new Date().toISOString()
            });

            await storage.updateUserProfile(userId, { learningProtocols: protocols });
            console.log(`Briefing Service: Learning protocol updated for user ${userId}`);
        } catch (error) {
            console.error("Error handling user feedback:", error);
        }
    }
}

export const briefingService = new BriefingService();
