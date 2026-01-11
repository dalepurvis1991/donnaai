import { storage } from "../storage";
import { gmailApiService } from "./gmailApiService";
import { outlookApiService } from "./outlookApiService";
import { calendarApiService } from "./calendarApiService";
import { taskService } from "./taskService";
import { correlationService } from "./correlationService";
import { draftAssistantService } from "./draftAssistantService";
import { vectorService } from "./vectorService";
import { digestService } from "./digestService";
import { openaiService } from "./openaiService";
import { memoryService } from "./memoryService";
import type { User, Email, InsertEmail, TriageMetadata } from "@shared/schema";

export class AgentService {
    private interval: NodeJS.Timeout | null = null;
    private readonly POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes

    async start() {
        console.log("Agent Service: Starting autonomous loop...");
        this.runIteration();
        this.interval = setInterval(() => this.runIteration(), this.POLL_INTERVAL);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private async runIteration() {
        console.log(`Agent Service: Iteration started at ${new Date().toISOString()}`);
        try {
            const users = await storage.getUsers();
            for (const user of users) {
                if (user.googleAccessToken || user.microsoftAccessToken) {
                    await this.runSuite(user.id);
                }
            }
        } catch (error) {
            console.error("Agent Service: Iteration error:", error);
        }
    }

    async runSuite(userId: string) {
        console.log(`Agent Service: Running suite for user ${userId}`);
        try {
            const user = await storage.getUser(userId);
            if (!user || (!user.googleAccessToken && !user.microsoftAccessToken)) return;

            // Determine email pull limit based on plan
            const emailLimit = this.getEmailLimitForPlan(user.planType || 'free');
            console.log(`Agent Service: Using email limit ${emailLimit} for plan ${user.planType || 'free'}`);

            // 1. Sync new emails
            const emailsToStorage: InsertEmail[] = [];
            if (user.googleAccessToken) {
                try {
                    const googleEmails = await gmailApiService.fetchUserEmails(user, emailLimit);
                    emailsToStorage.push(...googleEmails);
                } catch (e) { console.error(`Gmail sync failed: `, e); }
            }
            if (user.microsoftAccessToken) {
                try {
                    const outlookEmails = await outlookApiService.fetchUserEmails(user, emailLimit);
                    emailsToStorage.push(...outlookEmails);
                } catch (e) { console.error(`Outlook sync failed: `, e); }
            }

            for (const emailData of emailsToStorage) {
                await storage.upsertEmail(emailData);
            }


            // 1.5 Sync calendar events
            if (user.googleAccessToken) {
                try {
                    console.log(`Agent Service: Syncing calendar for user ${userId}`);
                    const googleEvents = await calendarApiService.fetchUserEvents(user, 7);
                    for (const event of googleEvents) {
                        await storage.createCalendarEvent(event);
                    }
                    console.log(`Agent Service: Synced ${googleEvents.length} calendar events for ${userId}`);
                } catch (e) {
                    console.error(`Calendar sync failed for user ${userId}: `, e);
                }
            }

            // 2. Identify new items
            const unprocessed = await storage.getUnprocessedEmails(userId);
            console.log(`Agent Service: Found ${unprocessed.length} unprocessed emails for ${userId}`);

            for (const email of unprocessed) {
                await this.processEmail(email, user);
            }

            // 3. Post-processing
            await digestService.generateFyiDigests(userId);
            await storage.updateUserLastAgentRun(userId);
            console.log(`Agent Service: Suite completed for ${userId}`);
        } catch (error) {
            console.error(`Agent Service: Error: `, error);
        }
    }

    private async processEmail(email: Email, user: User) {
        console.log(`Agent Service: Processing email ${email.id}`);
        try {
            // Stage 1: Memory & Indexing
            await vectorService.indexEmail(email.id, user.id);
            const context = await memoryService.getFullContext(user.id);

            // Stage 2: Triage (Extract & Classify)

            // Bypass triage for purely sent emails (context only)
            // We use loose matching in case of aliases, but primary email is best
            const isSentEmail = email.senderEmail.toLowerCase() === user.email?.toLowerCase();

            if (isSentEmail) {
                console.log(`Agent Service: Email ${email.id} is SENT by user. Skipping triage queue.`);
                // We still want it in memory (Stage 1 was done), just not in the decision queue
                await storage.updateEmail(email.id, {
                    category: 'Sent',
                    isProcessed: true,
                    aiSummary: "Sent by user - stored for context"
                });
                return;
            }

            const triagePrompt = `
Analyze this email for a business orchestrator (Donna).
Email: "${email.subject}"
Body: "${email.body}"

Context:
- Priorities: ${JSON.stringify(context.operational.priorities)}
- Risks: ${JSON.stringify(context.operational.risks)}

Extract intent, entities (customer, order, deadline), and classify urgency/impact.
            `;

            const triage = await openaiService.generateStructuredResponse(triagePrompt, "email_triage", {
                type: "json_schema",
                zodSchema: (await import("./openaiService")).TriageSchema,
                name: "triage"
            });

            // Stage 3: Decide (Confidence & Policy)
            const metadata: TriageMetadata = {
                intent: triage.intent,
                entities: triage.entities,
                confidence: triage.confidence,
                classification: triage.classification
            };

            const threshold = await memoryService.getEffectiveThreshold(user.id, triage.classification.category);

            // Mandatory gating (Launch Plan v1.0 Section 2)
            const isMandatoryGate = [
                'spend',
                'pricing_change',
                'publish',
                'external_comms',
                'data_change'
            ].includes(triage.intent || '');

            const needsApproval = isMandatoryGate ||
                triage.confidence < threshold ||
                triage.classification.impact === 'high';

            // Stage 4: Queue
            if (needsApproval) {
                await storage.createDecision({
                    userId: user.id,
                    type: this.mapIntentToDecisionType(triage.intent),
                    summary: `Triage requested: ${triage.intent || 'Review required'}. Confidence: ${triage.confidence}`,
                    riskNotes: triage.classification.impact === 'high' ? 'High impact action detected.' :
                        isMandatoryGate ? `Mandatory approval required for ${triage.intent}.` : null,
                    metadata: {
                        emailId: email.id,
                        triage,
                        confidenceUsed: triage.confidence,
                        thresholdUsed: threshold
                    }
                });
                await storage.createAuditLog(user.id, "Decision Queued", `Email ${email.id} requires manual review.`, email.id);
            } else {
                // Autonomous Path
                await taskService.processEmailForTasks(email.id, email, user.id);
                if (email.category === 'Draft') {
                    await draftAssistantService.generateReply(email.id, user.id);
                }
            }

            // Mark Processed
            const deducted = await storage.deductCredits(user.id, 1, 'email_processing', `Processed: ${email.subject}`);
            if (deducted) {
                await storage.upsertEmail({ ...email, triageMetadata: metadata, isProcessed: true });
            }

        } catch (error) {
            console.error(`Agent Service: Failed email ${email.id}: `, error);
        }
    }

    private mapIntentToDecisionType(intent: string | undefined): any {
        const mapping: Record<string, string> = {
            'spend': 'spend',
            'pricing_change': 'pricing',
            'publish': 'publish',
            'data_change': 'data_change'
        };
        return (intent && mapping[intent]) || 'other';
    }

    private getEmailLimitForPlan(planType: string): number {
        // Tiered email pull limits based on subscription
        switch (planType) {
            case 'yearly':
            case 'pro':
                return 250; // Pro users get 250 per sync (up to 1000 total context)
            case 'monthly':
            case 'trial':
                return 100; // Trial/Monthly users get 100
            case 'free':
            default:
                return 50; // Free users get 50
        }
    }
}

export const agentService = new AgentService();
