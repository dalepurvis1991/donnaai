import { storage } from "../storage";
import { openaiService } from "./openaiService";
import { nanoid } from "nanoid";
import type { Email, InsertEmailCorrelation } from "@shared/schema";

export interface CorrelationGroup {
  groupId: string;
  subject: string;
  type: string;
  emails: Array<{
    email: Email;
    metadata: any;
  }>;
  analysis?: {
    bestOption?: any;
    comparison?: any;
    recommendation?: string;
  };
}

export class CorrelationService {
  async detectCorrelations(email: Email, existingEmails: Email[]): Promise<InsertEmailCorrelation[]> {
    try {
      // Ask AI to find related emails
      const prompt = `Analyze this email and find if it correlates with any existing emails.
Look for:
1. Quotes for the same product/service
2. Invoices related to previous quotes or orders
3. Follow-ups to inquiries
4. Responses to requests

Email to analyze:
Subject: ${email.subject}
From: ${email.sender} (${email.senderEmail})
Body: ${email.body?.substring(0, 500)}

Existing emails (last 30 days):
${existingEmails.slice(0, 50).map(e => 
  `- Subject: ${e.subject}, From: ${e.sender}, Date: ${e.date}`
).join('\n')}

Respond with JSON:
{
  "correlations": [
    {
      "relatedEmailId": number,
      "correlationType": "quote|invoice|order|inquiry|response",
      "subject": "what this correlation is about",
      "confidence": 0.0-1.0,
      "metadata": {
        "price": number (if applicable),
        "vendor": "vendor name",
        "product": "product/service name",
        "notes": "any relevant notes"
      }
    }
  ]
}`;

      const response = await openaiService.generateStructuredResponse(prompt, "email_correlation");
      const result = JSON.parse(response);
      
      const correlations: InsertEmailCorrelation[] = [];
      
      if (result.correlations && result.correlations.length > 0) {
        // Check if these emails are already in a group
        for (const correlation of result.correlations) {
          const existingGroup = await storage.getEmailCorrelationGroup(correlation.relatedEmailId);
          const groupId = existingGroup?.groupId || nanoid();
          
          // Add the new email to the correlation group
          correlations.push({
            groupId,
            emailId: email.id!,
            correlationType: correlation.correlationType,
            subject: correlation.subject,
            confidence: correlation.confidence,
            metadata: correlation.metadata
          });
          
          // Also ensure the related email is in the group
          if (!existingGroup) {
            correlations.push({
              groupId,
              emailId: correlation.relatedEmailId,
              correlationType: correlation.correlationType,
              subject: correlation.subject,
              confidence: correlation.confidence,
              metadata: {}
            });
          }
        }
      }
      
      return correlations;
    } catch (error) {
      console.error("Error detecting correlations:", error);
      return [];
    }
  }

  async analyzeCorrelationGroup(groupId: string): Promise<any> {
    try {
      const correlations = await storage.getCorrelationsByGroup(groupId);
      if (correlations.length < 2) return null;

      // Get full email details for each correlation
      const emailDetails = await Promise.all(
        correlations.map(async (corr) => ({
          email: await storage.getEmailById(corr.emailId),
          metadata: corr.metadata
        }))
      );

      const correlationType = correlations[0].correlationType;
      
      if (correlationType === 'quote') {
        return this.analyzeQuotes(emailDetails, correlations[0].subject);
      } else if (correlationType === 'invoice' || correlationType === 'order') {
        return this.analyzeOrderProgress(emailDetails);
      }
      
      return null;
    } catch (error) {
      console.error("Error analyzing correlation group:", error);
      return null;
    }
  }

  private async analyzeQuotes(emailDetails: any[], subject: string): Promise<any> {
    const prompt = `Analyze these quote emails for "${subject}" and provide a comparison:

${emailDetails.map((detail, i) => `
Quote ${i + 1}:
From: ${detail.email.sender}
Subject: ${detail.email.subject}
Content: ${detail.email.body?.substring(0, 500)}
Metadata: ${JSON.stringify(detail.metadata)}
`).join('\n')}

Provide a JSON analysis:
{
  "bestOption": {
    "vendor": "vendor name",
    "price": number,
    "reason": "why this is the best option"
  },
  "comparison": {
    "priceRange": { "min": number, "max": number },
    "vendors": [
      {
        "name": "vendor",
        "price": number,
        "pros": ["list of pros"],
        "cons": ["list of cons"],
        "deliveryTime": "if mentioned",
        "warranty": "if mentioned"
      }
    ]
  },
  "recommendation": "detailed recommendation for the user"
}`;

    const response = await openaiService.generateStructuredResponse(prompt, "quote_analysis");
    return JSON.parse(response);
  }

  private async analyzeOrderProgress(emailDetails: any[]): Promise<any> {
    // Sort emails by date to track progress
    const sortedEmails = emailDetails.sort((a, b) => 
      new Date(a.email.date).getTime() - new Date(b.email.date).getTime()
    );

    const prompt = `Analyze this order/invoice thread and track its progress:

${sortedEmails.map((detail, i) => `
Email ${i + 1} (${new Date(detail.email.date).toLocaleDateString()}):
Type: ${detail.metadata?.correlationType || 'unknown'}
From: ${detail.email.sender}
Subject: ${detail.email.subject}
Content: ${detail.email.body?.substring(0, 300)}
`).join('\n')}

Provide a JSON timeline:
{
  "orderStatus": "pending|confirmed|shipped|delivered|completed",
  "timeline": [
    {
      "date": "ISO date",
      "event": "what happened",
      "details": "relevant details"
    }
  ],
  "nextAction": "what the user should do next",
  "totalValue": number (if applicable)
}`;

    const response = await openaiService.generateStructuredResponse(prompt, "order_timeline");
    return JSON.parse(response);
  }

  async createManualCorrelation(emailIds: number[], correlationType: string, subject: string): Promise<string> {
    const groupId = nanoid();
    const correlations: InsertEmailCorrelation[] = emailIds.map(emailId => ({
      groupId,
      emailId,
      correlationType,
      subject,
      confidence: 1.0, // Manual correlation has full confidence
      metadata: {}
    }));

    await storage.createEmailCorrelations(correlations);
    return groupId;
  }

  async getCorrelationGroups(userId: string): Promise<CorrelationGroup[]> {
    const groups = await storage.getUserCorrelationGroups(userId);
    const result: CorrelationGroup[] = [];

    for (const group of groups) {
      const correlations = await storage.getCorrelationsByGroup(group.groupId);
      const emailDetails = await Promise.all(
        correlations.map(async (corr) => ({
          email: await storage.getEmailById(corr.emailId),
          metadata: corr.metadata
        }))
      );

      result.push({
        groupId: group.groupId,
        subject: group.subject,
        type: group.correlationType,
        emails: emailDetails,
        analysis: await this.analyzeCorrelationGroup(group.groupId)
      });
    }

    return result;
  }
}

export const correlationService = new CorrelationService();