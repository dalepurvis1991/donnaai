
import "dotenv/config";
import { gmailApiService } from "./server/services/gmailApiService";
import { storage } from "./server/storage";
import { db } from "./server/db";
import { emails } from "./shared/schema";
import { count, eq } from "drizzle-orm";

async function debugSync() {
    try {
        const userId = "103432382345425460438";
        console.log(`Starting debug sync for user ${userId}...`);

        const fetchedEmails = await gmailApiService.fetchUserEmails(userId, 200); // Try 200 first
        console.log(`Fetched ${fetchedEmails.length} emails from Gmail.`);

        // Manually save to DB to confirm
        for (const email of fetchedEmails) {
            await storage.upsertEmail(email);
        }

        const result = await db.select({ count: count() }).from(emails).where(eq(emails.userId, userId));
        console.log(`New DB Count: ${result[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error("Sync failed:", error);
        process.exit(1);
    }
}

debugSync();
