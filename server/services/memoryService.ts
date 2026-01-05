import { storage } from "../storage";
import { type UserProfile, type UserPreferences } from "@shared/schema";

export class MemoryService {
    /**
     * Aggregates all context for a user for the AI to consume.
     */
    async getFullContext(userId: string) {
        const [profile, preferences, priorities, risks] = await Promise.all([
            storage.getUserProfile(userId),
            this.getPreferences(userId),
            storage.getOperationalMemory(userId, "priorities"),
            storage.getOperationalMemory(userId, "risks"),
        ]);

        return {
            profile: profile || {},
            preferences: preferences || {},
            operational: {
                priorities: priorities?.value || [],
                risks: risks?.value || [],
            }
        };
    }

    /**
     * Gets user preferences, ensuring defaults if not found.
     */
    async getPreferences(userId: string): Promise<Partial<UserPreferences>> {
        const prefs = await storage.getUserPreferences(userId);
        return prefs || {
            autoAssignEnabled: false,
            confidenceThreshold: 0.75,
            categoryThresholds: {
                finance: 0.90,
                external_comms: 0.85,
                operations: 0.75,
                marketing: 0.70
            }
        };
    }

    /**
     * Resolves the required confidence threshold for a specific category.
     */
    async getEffectiveThreshold(userId: string, category?: string): Promise<number> {
        const prefs = await this.getPreferences(userId);
        const globalThreshold = prefs.confidenceThreshold ?? 0.75;

        if (!category) return globalThreshold;

        const categoryThresholds = prefs.categoryThresholds as Record<string, number> | undefined;
        return categoryThresholds?.[category.toLowerCase()] ?? globalThreshold;
    }

    /**
     * Updates a specific operational memory key.
     */
    async updateOperationalMemory(userId: string, key: "priorities" | "risks" | "active_projects", value: any) {
        return await storage.upsertOperationalMemory(userId, key, value);
    }

    /**
     * Shortcut to get the business's current state summary.
     */
    async getOperationalSummary(userId: string) {
        const keys = ["priorities", "risks", "active_projects"];
        const memories = await Promise.all(keys.map(k => storage.getOperationalMemory(userId, k)));

        return memories.reduce((acc, mem, i) => {
            acc[keys[i]] = mem?.value || null;
            return acc;
        }, {} as Record<string, any>);
    }
}

export const memoryService = new MemoryService();
