import { openaiService } from "./server/services/openaiService";
import { vectorService } from "./server/services/vectorService";
import { z } from "zod";

async function runTests() {
    console.log("🚀 Starting AI Modernization Tests...");

    try {
        // 1. Test Structured Categorization
        console.log("\n--- Testing Structured Categorization ---");
        const catResult = await openaiService.categorizeEmail(
            "Meeting tomorrow at 10am",
            "Can we discuss the progress on the Q1 roadmap?",
            "John Doe",
            "john@example.com"
        );
        console.log("Result:", JSON.stringify(catResult, null, 2));
        if (catResult.category === "Draft") {
            console.log("✅ Categorization successful (Draft)");
        } else {
            console.log("⚠️ Categorization unexpected:", catResult.category);
        }

        // 2. Test Real Embeddings & Search
        console.log("\n--- Testing Semantic Search ---");
        const userId = "test-user-1";

        // Index sample data
        await vectorService.indexNote("test-1", "The pricing for the pro plan is $20 per month.", userId);
        await vectorService.indexNote("test-2", "We offer a 30% discount for non-profits.", userId);

        // Search
        const searchResult = await vectorService.searchMemories("How much does it cost?", userId);
        console.log("Search Results:", searchResult.map(r => ({ text: r.document.text, score: r.score })));

        if (searchResult.length > 0 && searchResult[0].document.text.includes("pricing")) {
            console.log("✅ Semantic search successful");
        } else {
            console.log("❌ Semantic search failed to find relevant content");
        }

        // 3. Test Task Detection Schema
        console.log("\n--- Testing Task Detection Schema ---");
        const TaskDetectionSchema = z.object({
            isTask: z.boolean(),
            confidence: z.number(),
            reasoning: z.string()
        });

        const taskResult = await openaiService.generateStructuredResponse(
            "Send the invoice to the client by Friday.",
            "task_detection",
            { type: "json_schema", zodSchema: TaskDetectionSchema, name: "task_detection" }
        );
        console.log("Task Result:", JSON.stringify(taskResult, null, 2));
        if (taskResult.isTask) {
            console.log("✅ Task detection successful");
        }

        console.log("\n🎉 All tests completed!");
    } catch (error) {
        console.error("\n❌ Test failed:", error);
    }
}

runTests();
