import { storage } from "../storage";
import { gmailApiService } from "./gmailApiService";
import { taskService } from "./taskService";
import { correlationService } from "./correlationService";
import { draftAssistantService } from "./draftAssistantService";
import { vectorService } from "./vectorService";
import type { User, Email } from "@shared/schema";

export class AgentService {
    private interval: NodeJS.Timeout | null = null;
    private readonly POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes

    async start() {
        console.log("Agent Service: Starting autonomous loop...");

        // Run immediately on start
        this.runIteration();

        // Schedule periodic runs
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
            console.log(`Agent Service: Iterating over ${users.length} users`);

            for (const user of users) {
                if (user.googleAccessToken) {
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
            if (!user || !user.googleAccessToken) {
                console.log(`Agent Service: User ${userId} not eligible (no token)`);
                return;
            }

            // 1. Sync new emails
            console.log(`Agent Service: Syncing emails for ${userId}...`);
            const newEmails = await gmailApiService.fetchUserEmails(user, 20); // Sync last 20 emails

            const processedEmails: Email[] = [];
            for (const emailData of newEmails) {
                const email = await storage.upsertEmail(emailData);
                processedEmails.push(email);
            }

            // 2. Identify new items (not yet processed by agent)
            const unprocessed = await storage.getUnprocessedEmails(userId);
            console.log(`Agent Service: Found ${unprocessed.length} unprocessed emails for ${userId}`);

            for (const email of unprocessed) {
                await this.processEmail(email, user);
            }

            // 3. Update last run time
            await storage.updateUserLastAgentRun(userId);
            console.log(`Agent Service: Suite completed for ${userId}`);
        } catch (error) {
            console.error(`Agent Service: Error running suite for ${userId}:`, error);
        }
    }

    private async processEmail(email: Email, user: User) {
        console.log(`Agent Service: Processing email ${email.id} (${email.subject})`);
        try {
            // A. Vector Indexing (Memory)
            await vectorService.indexEmail(email.id, user.id);

            // B. Correlation Detection
            const existingEmails = await storage.getEmails(user.id);
            const correlations = await correlationService.detectCorrelations(email, existingEmails);
            if (correlations.length > 0) {
                await storage.createEmailCorrelations(correlations);
            }

            // C. Task Detection
            const tasks = await taskService.detectTasksFromEmail(email);
            for (const task of tasks) {
                await storage.createTask({
                    ...task,
                    userId: user.id,
                    status: 'pending'
                });
            }

            // D. Proactive Drafting
            if (email.category === 'Draft') {
                const draft = await draftAssistantService.generateDraftReply(email.id, user.id);
                if (draft) {
                    console.log(`Agent Service: Generated draft for ${email.id}`);
                    // The draftAssistantService typically saves to its own storage or returns it.
                    // In our V1, it might just be available in the 'Drafts' section.
                }
            }

            // E. Mark as processed
            await storage.upsertEmail({
                ...email,
                isProcessed: true
            });

        } catch (error) {
            console.error(`Agent Service: Failed to process email ${email.id}:`, error);
        }
    }
}

export const agentService = new AgentService();
