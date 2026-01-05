import { openaiService } from "./openaiService";

/**
 * Email Cleaning Service
 * Strips signatures, removes quoted replies, and preserves important content
 * per MVP specification Phase 3
 */
export class EmailCleaningService {

    // Common signature separators
    private signatureSeparators = [
        /^--\s*$/m,                                     // Standard --
        /^___+$/m,                                      // Underscores
        /^-{3,}$/m,                                     // Dashes
        /^_{3,}$/m,                                     // Underscores
        /^Sent from my iPhone/mi,
        /^Sent from my iPad/mi,
        /^Sent from my Android/mi,
        /^Sent from Mail for Windows/mi,
        /^Get Outlook for iOS/mi,
        /^Get Outlook for Android/mi,
        /^Sent from Outlook/mi,
        /^Best regards?,?$/mi,
        /^Kind regards?,?$/mi,
        /^Thanks,?$/mi,
        /^Thank you,?$/mi,
        /^Cheers,?$/mi,
        /^Regards,?$/mi,
        /^Best,?$/mi,
        /^Sincerely,?$/mi,
    ];

    // Quoted text patterns (e.g., "On DATE, NAME wrote:")
    private quotedTextPatterns = [
        /^On .+ wrote:$/mi,                             // Gmail/Apple Mail style
        /^From: .+$/mi,                                 // Outlook style forwarding
        /^-+\s*Original Message\s*-+$/mi,               // Outlook original message
        /^-+\s*Forwarded Message\s*-+$/mi,              // Forwarded message header
        /^>+\s*/m,                                      // Quote markers
        /^Date: .+$/mi,                                 // Date header in quotes
        /^Subject: .+$/mi,                              // Subject header in quotes
        /^To: .+$/mi,                                   // To header in quotes
    ];

    /**
     * Clean an email body by removing signatures and quoted text
     * Returns both clean and full versions as per spec
     */
    cleanEmail(rawBody: string): { clean: string; full: string } {
        if (!rawBody) {
            return { clean: "", full: "" };
        }

        // Store original for full version
        const full = rawBody;

        let clean = rawBody;

        // Step 1: Remove signature blocks
        clean = this.removeSignature(clean);

        // Step 2: Remove quoted replies
        clean = this.removeQuotedText(clean);

        // Step 3: Clean up whitespace
        clean = this.cleanWhitespace(clean);

        return { clean, full };
    }

    /**
     * Remove signature blocks from email
     */
    private removeSignature(body: string): string {
        let result = body;

        for (const separator of this.signatureSeparators) {
            const match = result.match(separator);
            if (match) {
                const index = result.search(separator);
                if (index !== -1) {
                    // Keep content before the signature
                    const beforeSignature = result.substring(0, index);
                    // Only remove if there's meaningful content before
                    if (beforeSignature.trim().length > 50) {
                        result = beforeSignature;
                        break; // Stop at first signature match
                    }
                }
            }
        }

        return result;
    }

    /**
     * Remove quoted/forwarded text blocks
     */
    private removeQuotedText(body: string): string {
        let result = body;
        const lines = result.split('\n');
        const cleanedLines: string[] = [];
        let inQuotedBlock = false;

        for (const line of lines) {
            // Check if this line starts a quoted block
            const isQuoteStart = this.quotedTextPatterns.some(pattern => pattern.test(line));

            // Check if line is a quote marker line (starts with >)
            const isQuoteLine = /^>+/.test(line);

            if (isQuoteStart) {
                inQuotedBlock = true;
            } else if (inQuotedBlock && !isQuoteLine && line.trim().length > 0 && !/^(From|To|Date|Subject|Cc):/.test(line)) {
                // Reset if we encounter non-quoted content
                inQuotedBlock = false;
            }

            if (!inQuotedBlock && !isQuoteLine) {
                cleanedLines.push(line);
            }
        }

        return cleanedLines.join('\n');
    }

    /**
     * Clean up excessive whitespace while preserving structure
     */
    private cleanWhitespace(body: string): string {
        return body
            .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
            .replace(/[ \t]+$/gm, '')     // Trailing whitespace
            .replace(/^[ \t]+/gm, '')     // Leading whitespace (but preserve indentation intent)
            .trim();
    }

    /**
     * Extract key entities from cleaned email (basic implementation)
     * This supplements the AI extraction with simple pattern matching
     */
    extractBasicEntities(body: string): {
        emails: string[];
        phoneNumbers: string[];
        urls: string[];
        dates: string[];
        amounts: string[];
        orderNumbers: string[];
    } {
        const entities = {
            emails: [] as string[],
            phoneNumbers: [] as string[],
            urls: [] as string[],
            dates: [] as string[],
            amounts: [] as string[],
            orderNumbers: [] as string[]
        };

        // Extract emails
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        entities.emails = [...new Set(body.match(emailRegex) || [])];

        // Extract phone numbers (UK and US formats)
        const phoneRegex = /(?:\+44|0)?\s*(?:\d[\s.-]?){10,11}|\+1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
        entities.phoneNumbers = [...new Set(body.match(phoneRegex) || [])];

        // Extract URLs
        const urlRegex = /https?:\/\/[^\s<>\"]+/gi;
        entities.urls = [...new Set(body.match(urlRegex) || [])];

        // Extract dates (various formats)
        const dateRegex = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{2,4}?\b/gi;
        entities.dates = [...new Set(body.match(dateRegex) || [])];

        // Extract currency amounts
        const amountRegex = /[£$€]\s*\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:GBP|USD|EUR)/gi;
        entities.amounts = [...new Set(body.match(amountRegex) || [])];

        // Extract order/reference numbers (common patterns)
        const orderRegex = /\b(?:order|ref|reference|invoice|po|purchase order|booking)[\s#:]*([A-Z0-9\-]{5,20})\b/gi;
        const orderMatches = [...body.matchAll(orderRegex)];
        entities.orderNumbers = [...new Set(orderMatches.map(m => m[1]))];

        return entities;
    }
}

export const emailCleaningService = new EmailCleaningService();
