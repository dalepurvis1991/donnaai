
import "dotenv/config";
import { db } from "./server/db";
import { decisions, tasks } from "./shared/schema";
import { count, eq } from "drizzle-orm";

async function checkData() {
    try {
        const userId = "103432382345425460438";

        const dCount = await db.select({ count: count() }).from(decisions).where(eq(decisions.userId, userId));
        const tCount = await db.select({ count: count() }).from(tasks).where(eq(tasks.userId, userId));

        console.log(`Decisions Count: ${dCount[0].count}`);
        console.log(`Tasks Count: ${tCount[0].count}`);
        process.exit(0);
    } catch (error) {
        console.error("Error checking data:", error);
        process.exit(1);
    }
}

checkData();
