import { storage } from "../storage";
import { openaiService } from "./openaiService";

/**
 * Style Profile Service
 * Analyzes sent emails to learn user's writing style (opt-in)
 * Generates style_prompt for personalized draft replies
 * Per MVP specification Phase 6
 */

export interface StyleProfile {
    greetings: string[];
    signoffs: string[];
    formalityScore: number; // 0-1 (0 = very casual, 1 = very formal)
    verbosity: "short" | "medium" | "long";
    commonPhrases: string[];
    doRules: string[];
    dontRules: string[];
    exampleSentences: string[];
    stylePrompt: string;
    analyzedEmailCount: number;
    lastUpdated: Date;
}

export class StyleProfileService {

    /**
     * Build a style profile from user's sent emails (opt-in only)
     */
    async buildProfileFromSentMail(userId: string, sampleSize: number = 200): Promise<StyleProfile> {
        try {
            // Get user's sent emails
            const emails = await storage.getEmails(userId);

            // Filter to only sent emails (would need a 'folder' field in real implementation)
            // For now, we'll analyze all emails as a starting point
            const sampleEmails = emails.slice(0, sampleSize);

            if (sampleEmails.length < 5) {
                return this.getDefaultProfile();
            }

            // Extract patterns from emails
            const greetings = this.extractGreetings(sampleEmails);
            const signoffs = this.extractSignoffs(sampleEmails);
            const formalityScore = this.calculateFormality(sampleEmails);
            const verbosity = this.calculateVerbosity(sampleEmails);
            const commonPhrases = this.extractCommonPhrases(sampleEmails);

            // Build style profile
            const profile: StyleProfile = {
                greetings,
                signoffs,
                formalityScore,
                verbosity,
                commonPhrases,
                doRules: this.inferDoRules(formalityScore, verbosity, commonPhrases),
                dontRules: this.inferDontRules(formalityScore, sampleEmails),
                exampleSentences: this.extractExampleSentences(sampleEmails, 5),
                stylePrompt: "",
                analyzedEmailCount: sampleEmails.length,
                lastUpdated: new Date()
            };

            // Generate the style prompt
            profile.stylePrompt = this.generateStylePrompt(profile);

            return profile;
        } catch (error) {
            console.error("Error building style profile:", error);
            return this.getDefaultProfile();
        }
    }

    /**
     * Extract common greeting patterns from emails
     */
    private extractGreetings(emails: any[]): string[] {
        const greetings: Map<string, number> = new Map();

        const greetingPatterns = [
            /^(Hi|Hello|Hey|Dear|Good morning|Good afternoon|Good evening)\s+[A-Z][a-z]*/mi,
            /^(Hi|Hello|Hey|Dear)\s*,/mi,
            /^(Morning|Afternoon|Evening)\s*/mi,
        ];

        for (const email of emails) {
            const body = email.body || "";
            const firstLines = body.split('\n').slice(0, 3).join(' ');

            for (const pattern of greetingPatterns) {
                const match = firstLines.match(pattern);
                if (match) {
                    const greeting = match[0].replace(/\s+[A-Z][a-z]+$/, '').trim();
                    greetings.set(greeting, (greetings.get(greeting) || 0) + 1);
                }
            }
        }

        return Array.from(greetings.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([greeting]) => greeting);
    }

    /**
     * Extract common sign-off patterns from emails
     */
    private extractSignoffs(emails: any[]): string[] {
        const signoffs: Map<string, number> = new Map();

        const signoffPatterns = [
            /(Best regards?|Kind regards?|Regards?|Thanks|Thank you|Cheers|Best|Sincerely|Warmly|All the best)\s*,?\s*$/mi,
        ];

        for (const email of emails) {
            const body = email.body || "";
            const lastLines = body.split('\n').slice(-10).join('\n');

            for (const pattern of signoffPatterns) {
                const match = lastLines.match(pattern);
                if (match) {
                    signoffs.set(match[1], (signoffs.get(match[1]) || 0) + 1);
                }
            }
        }

        return Array.from(signoffs.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([signoff]) => signoff);
    }

    /**
     * Calculate formality score based on email content
     */
    private calculateFormality(emails: any[]): number {
        let totalScore = 0;
        let count = 0;

        const formalIndicators = [
            /\b(please|kindly|would you|could you|I would|we would)\b/gi,
            /\b(sincerely|regards|respectfully)\b/gi,
            /\b(Dear Mr|Dear Ms|Dear Dr|Dear Sir|Dear Madam)\b/gi,
        ];

        const informalIndicators = [
            /\b(hey|hi there|gonna|wanna|gotta|yeah|yep|nope)\b/gi,
            /!{2,}/g,
            /\b(lol|haha|btw|fyi|asap)\b/gi,
        ];

        for (const email of emails) {
            const body = email.body || "";
            let formalCount = 0;
            let informalCount = 0;

            for (const pattern of formalIndicators) {
                formalCount += (body.match(pattern) || []).length;
            }
            for (const pattern of informalIndicators) {
                informalCount += (body.match(pattern) || []).length;
            }

            if (formalCount + informalCount > 0) {
                totalScore += formalCount / (formalCount + informalCount);
                count++;
            }
        }

        return count > 0 ? totalScore / count : 0.5;
    }

    /**
     * Calculate typical email verbosity
     */
    private calculateVerbosity(emails: any[]): "short" | "medium" | "long" {
        const lengths = emails.map(e => (e.body || "").length);
        const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

        if (avgLength < 200) return "short";
        if (avgLength < 500) return "medium";
        return "long";
    }

    /**
     * Extract commonly used phrases
     */
    private extractCommonPhrases(emails: any[]): string[] {
        const phrases: Map<string, number> = new Map();

        const phrasePatterns = [
            /I hope this (email )?finds you well/gi,
            /Please (let me know|feel free|don't hesitate)/gi,
            /Looking forward to/gi,
            /Happy to (help|assist|discuss)/gi,
            /Thank you for (your|the)/gi,
            /I wanted to (follow up|check in|reach out)/gi,
            /Just a quick (note|update|reminder)/gi,
        ];

        for (const email of emails) {
            const body = email.body || "";
            for (const pattern of phrasePatterns) {
                const matches = body.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        phrases.set(match.toLowerCase(), (phrases.get(match.toLowerCase()) || 0) + 1);
                    }
                }
            }
        }

        return Array.from(phrases.entries())
            .filter(([_, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([phrase]) => phrase);
    }

    /**
     * Infer "do" rules based on style analysis
     */
    private inferDoRules(formality: number, verbosity: string, phrases: string[]): string[] {
        const rules: string[] = [];

        if (formality > 0.7) rules.push("Use formal language and proper salutations");
        else if (formality < 0.3) rules.push("Keep tone casual and friendly");
        else rules.push("Balance professionalism with approachability");

        if (verbosity === "short") rules.push("Keep responses concise and to the point");
        else if (verbosity === "long") rules.push("Provide thorough, detailed responses");

        if (phrases.some(p => p.includes("hope"))) rules.push("Include warm opening phrases");
        if (phrases.some(p => p.includes("thank"))) rules.push("Express gratitude when appropriate");

        return rules;
    }

    /**
     * Infer "don't" rules based on style analysis
     */
    private inferDontRules(formality: number, emails: any[]): string[] {
        const rules: string[] = [];

        // Check for emoji usage
        const emojiPattern = /[\u{1F300}-\u{1F9FF}]/gu;
        const hasEmoji = emails.some(e => emojiPattern.test(e.body || ""));
        if (!hasEmoji) rules.push("Don't use emojis");

        // Check for exclamation marks
        const hasExcessiveExclamation = emails.some(e => (e.body?.match(/!{2,}/g) || []).length > 0);
        if (!hasExcessiveExclamation) rules.push("Don't use multiple exclamation marks");

        if (formality > 0.6) {
            rules.push("Don't use slang or abbreviations");
            rules.push("Don't be too informal");
        }

        return rules;
    }

    /**
     * Extract example sentences that represent user's style
     */
    private extractExampleSentences(emails: any[], count: number): string[] {
        const sentences: string[] = [];

        for (const email of emails.slice(0, 20)) {
            const body = email.body || "";
            // Get first sentence of email body (likely user's own writing, not quoted)
            const firstSentence = body.split(/[.!?]/)[0]?.trim();
            if (firstSentence && firstSentence.length > 20 && firstSentence.length < 200) {
                sentences.push(firstSentence);
            }
        }

        return sentences.slice(0, count);
    }

    /**
     * Generate a style prompt for the LLM based on the profile
     */
    private generateStylePrompt(profile: StyleProfile): string {
        const parts: string[] = ["Write in the user's personal style:"];

        if (profile.greetings.length > 0) {
            parts.push(`- Preferred greetings: ${profile.greetings.slice(0, 3).join(", ")}`);
        }

        if (profile.signoffs.length > 0) {
            parts.push(`- Preferred sign-offs: ${profile.signoffs.slice(0, 2).join(", ")}`);
        }

        const formalityLabel = profile.formalityScore > 0.7 ? "formal" :
            profile.formalityScore < 0.3 ? "casual" : "balanced";
        parts.push(`- Tone: ${formalityLabel}`);
        parts.push(`- Length preference: ${profile.verbosity} responses`);

        for (const rule of profile.doRules.slice(0, 3)) {
            parts.push(`- ${rule}`);
        }

        for (const rule of profile.dontRules.slice(0, 2)) {
            parts.push(`- ${rule}`);
        }

        return parts.join("\n");
    }

    /**
     * Get default profile for users without enough data
     */
    private getDefaultProfile(): StyleProfile {
        return {
            greetings: ["Hi", "Hello"],
            signoffs: ["Best regards", "Thanks"],
            formalityScore: 0.5,
            verbosity: "medium",
            commonPhrases: [],
            doRules: ["Be professional but approachable", "Keep responses clear and helpful"],
            dontRules: ["Don't be too formal or stiff"],
            exampleSentences: [],
            stylePrompt: "Write in a professional yet friendly tone. Be clear and helpful.",
            analyzedEmailCount: 0,
            lastUpdated: new Date()
        };
    }

    /**
     * Update profile based on user's edit of a draft
     * Learns from corrections to improve future drafts
     */
    async updateFromDraftEdit(userId: string, originalDraft: string, editedDraft: string): Promise<void> {
        // This would analyze the diff between original and edited draft
        // and adjust the style profile accordingly
        // For MVP, we'll just log this for future implementation
        console.log(`Style learning: User ${userId} edited draft. Length change: ${editedDraft.length - originalDraft.length}`);

        // TODO: Implement learning from edits
        // - Track if user adds/removes greetings
        // - Track if user shortens or lengthens responses
        // - Track tone changes
    }
}

export const styleProfileService = new StyleProfileService();
