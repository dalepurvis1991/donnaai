
import "dotenv/config";
import { briefingService } from "./server/services/briefingService";
import { storage } from "./server/storage";

async function forceBriefing() {
    const userId = "103432382345425460438";
    console.log(`Forcing briefing generation for user ${userId}...`);

    try {
        const brief = await briefingService.generateDailyBriefing(userId);
        console.log("Briefing generated successfully:");
        console.log("Summary:", brief.summary);
        console.log("Priorities:", brief.priorities);
        console.log("Questions:", brief.questions.length);

        // Manually ensure it is saved (briefingService usually does this, but verify)
        // BriefingService saves priorities to 'priorities' operational memory

        process.exit(0);
    } catch (error) {
        console.error("Force Briefing Failed:", error);
        process.exit(1);
    }
}

forceBriefing();
