import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";

export const PLANS = {
    FREE: "free",
    TRIAL: "trial",
    MONTHLY: "monthly",
    YEARLY: "yearly",
} as const;

export const FEATURES = {
    DELEGATIONS: "delegations",
    MEMORY_LEARNING: "memory_learning",
    CUSTOM_THRESHOLDS: "custom_thresholds",
    UNLIMITED_DECISIONS: "unlimited_decisions",
} as const;

export type Feature = typeof FEATURES[keyof typeof FEATURES];

export function requirePlan(feature: Feature) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user as User;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { planType, trialEndsAt } = user;
        const isPaid = planType === PLANS.MONTHLY || planType === PLANS.YEARLY;
        const isTrial = planType === PLANS.TRIAL && trialEndsAt && new Date(trialEndsAt) > new Date();

        if (isPaid || isTrial) {
            return next();
        }

        // Feature-specific gating logic for Free tier
        switch (feature) {
            case FEATURES.DELEGATIONS:
            case FEATURES.MEMORY_LEARNING:
            case FEATURES.CUSTOM_THRESHOLDS:
                // Strictly blocked for Free tier
                return res.status(403).json({
                    message: "Upgrade Required",
                    code: "UPGRADE_REQUIRED",
                    feature: feature
                });

            case FEATURES.UNLIMITED_DECISIONS:
                // This might be rate-limited instead of strictly blocked, but for now block
                return next(); // Allow for now, or implement count check

            default:
                return next();
        }
    };
}
