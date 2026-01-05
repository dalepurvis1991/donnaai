import { agentService } from "./agentService";
import { storage } from "../storage";
import { taskService } from "./taskService";

/**
 * Orchestrator Triage Test Harness
 * Simulates different email scenarios to verify the gating and delegation logic.
 */
export async function runTriageTest(userId: string) {
    console.log("--- STARTING ORCHESTRATOR TRIAGE TEST ---");

    const testCases = [
        {
            id: "low_impact",
            subject: "Meeting follow up",
            body: "Just wanted to say thanks for the meeting. Let's talk next week.",
            sender: "John Doe",
            senderEmail: "john@example.com",
            expectedPath: "autonomous/fyi"
        },
        {
            id: "high_impact_spend",
            subject: "Invoice for Server Hardware",
            body: "Please approve this payment of £5,400 for the new GPU cluster deployment.",
            sender: "AWS Billing",
            senderEmail: "billing@aws.com",
            expectedPath: "gated/approval"
        },
        {
            id: "task_delegate",
            subject: "Fixing the plumbing in Unit 4",
            body: "Maintenance team, we have a leak in the main bathroom. Needs fixing by Friday.",
            sender: "Tenant",
            senderEmail: "tenant@property.com",
            expectedPath: "autonomous/assigned" // Assuming Maintenance team member exists and auto-assign is on
        }
    ];

    for (const testCase of testCases) {
        console.log(`\nTesting Case: ${testCase.id} (${testCase.subject})`);

        // 1. Storage setup
        const email = await storage.createEmail({
            userId,
            subject: testCase.subject,
            body: testCase.body,
            sender: testCase.sender,
            senderEmail: testCase.senderEmail,
            messageId: `test-${testCase.id}-${Date.now()}`,
            date: new Date(),
            category: 'FYI',
            isProcessed: false
        });

        // 2. Run Triage
        console.log("Processing via AgentService...");
        await (agentService as any).processEmail(email, { id: userId } as any);

        // 3. Verify Result
        const updatedEmail = await storage.getEmails(userId);
        const latestEmail = updatedEmail.find(e => e.id === email.id);
        const decisions = await storage.getDecisions(userId, "pending");
        const tasks = await storage.getUserTasks(userId);

        console.log("Triage Metadata:", JSON.stringify(latestEmail?.triageMetadata, null, 2));

        const decisionForEmail = decisions.find(d => (d.metadata as any)?.emailId === email.id);
        if (decisionForEmail) {
            console.log("Result: GATED (Decision Queue Item Created)");
        } else {
            console.log("Result: AUTONOMOUS (Bypassed Decision Queue)");
            const taskForEmail = tasks.find(t => t.detectedFromEmailId === email.id);
            if (taskForEmail) {
                console.log(`Task Created: ${taskForEmail.title} (Status: ${taskForEmail.status})`);
            }
        }
    }

    console.log("\n--- TRIAGE TEST COMPLETE ---");
}
