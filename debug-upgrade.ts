
import "dotenv/config";
import { storage } from "./server/storage";
import { db } from "./server/db";
import { users, emails } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
    const userId = "103432382345425460438";

    console.log("Checking user...");
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (user) {
        console.log(`User ${user.email} current plan: ${user.planType}`);
        console.log(`User credits: ${user.credits}`);

        console.log("Upgrading to yearly and adding 1000 credits...");
        await db
            .update(users)
            .set({ planType: "yearly", credits: 1000 })
            .where(eq(users.id, userId));
        console.log("Upgrade and credits complete.");
    } else {
        console.error("User not found!");
    }

    const emailCount = await db.select().from(emails).where(eq(emails.userId, userId));
    console.log(`Found ${emailCount.length} emails for user ${userId}`);

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
