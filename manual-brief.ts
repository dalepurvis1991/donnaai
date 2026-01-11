
import "dotenv/config";
import { briefingService } from "./server/services/briefingService";
import { storage } from "./server/storage";
import { openaiService } from "./server/services/openaiService";

async function testBriefing() {
    try {
        const userId = "103432382345425460438";
        console.log(`Generating briefing for user ${userId}...`);

        // Check raw emails first
        const emails = await storage.getEmails(userId);
        console.log(`Total Emails in DB: ${emails.length}`);

        // Run briefing
        const brief = await briefingService.generateDailyBriefing(userId);
        console.log("Briefing Result:", JSON.stringify(brief, null, 2));

        // Check "Priorities" in operational memory
        const priorities = await storage.getOperationalMemory(userId, "priorities");
        console.log("Stored Priorities:", JSON.stringify(priorities, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Briefing Failed:", error);
        process.exit(1);
    }
}

testBriefing();
