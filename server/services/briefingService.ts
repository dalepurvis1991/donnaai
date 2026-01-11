import { storage } from "../storage";
import { openaiService } from "./openaiService";
import { Email } from "@shared/schema";

export interface BriefingResult {
    summary: string;
    priorities: string[];
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
            // 1. Get recent emails (scans both read and unread for context)
            const emails = await storage.getEmails(userId);
            // Sort by receivedDate descending if possible, or just take the raw list if already sorted by the query
            const recentEmails = emails.slice(0, 50);

            if (recentEmails.length === 0) {
                return {
                    summary: "Your neural core is synchronized. No recent traces detected.",
                    priorities: [],
                    questions: []
                };
            }

            // 2. Fetch user profile for context and learning protocols
            const profile = await storage.getUserProfile(userId);
            const protocols = profile?.learningProtocols || [];

            // 3. Generate summary and questions via LLM
            const emailContext = recentEmails.map(e => ({
                id: e.id,
                from: e.sender,
                subject: e.subject,
                body: e.body?.substring(0, 300)
            }));

            const prompt = `
Generate a concise executive briefing for the following unread emails.
1. Summarize the key activity.
2. Identify 3-5 "Strategic Priorities" (high-level goals or blockers) based on these emails.
3. Generate 1-2 "Direction Questions" for ambiguous items.

User Style Context: ${profile?.stylePrompt || "Professional and efficient"}
Learning Protocols: ${JSON.stringify(protocols)}

Emails:
${JSON.stringify(emailContext)}

Response JSON:
{
  "summary": "2-3 sentence summary",
  "priorities": ["Priority 1", "Priority 2"],
  "questions": [...]
}
`;

            const response = await openaiService.generateStructuredResponse(prompt, "daily_briefing", {
                type: "json_schema",
                zodSchema: openaiService.getDailyBriefingSchema(),
                name: "daily_briefing"
            });

            if (!response.priorities || response.priorities.length === 0) {
                // Fallback for V1 if LLM is too conservative or context is sparse
                response.priorities = [
                    "Review recent email activity",
                    "Verify agent configuration settings",
                    "Check pending tasks"
                ];
            }

            // 4. Save priorities to Operational Memory
            if (response.priorities && response.priorities.length > 0) {
                await storage.upsertOperationalMemory(userId, "priorities", response.priorities);
            }

            return response;
        } catch (error) {
            console.error("Error generating daily briefing:", error);
            return {
                summary: `Error synchronizing briefing protocols: ${(error as Error).message}`,
                priorities: [],
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
