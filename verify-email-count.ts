
import "dotenv/config";
import { db } from "./server/db";
import { emails } from "./shared/schema";
import { count, eq } from "drizzle-orm";

async function checkCount() {
    try {
        const userId = "103432382345425460438"; // User ID from context
        const result = await db.select({ count: count() }).from(emails).where(eq(emails.userId, userId));
        console.log(`Current email count for user ${userId}: ${result[0].count}`);
        process.exit(0);
    } catch (error) {
        console.error("Error checking count:", error);
        process.exit(1);
    }
}

checkCount();
