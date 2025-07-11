import { storage } from "../storage";
import { openaiService } from "./openaiService";

export interface BusinessMetrics {
  salesOrders: {
    count: number;
    totalValue: number;
    currency: string;
    products: Record<string, number>; // product name -> quantity
    averageOrderValue: number;
  };
  emailCounts: {
    total: number;
    byCategory: Record<string, number>;
    topSenders: Array<{ sender: string; count: number }>;
  };
  customMetrics: Record<string, any>;
}

export interface DailyDigestData {
  date: Date;
  period: "24h" | "7d" | "30d";
  metrics: BusinessMetrics;
  summary: string;
  insights: string[];
  recommendations: string[];
}

export class DigestService {
  async generateDailyDigest(userId: string, hoursBack: number = 24): Promise<DailyDigestData> {
    try {
      // Get recent emails
      const allEmails = await storage.getEmails();
      const cutoffDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      const recentEmails = allEmails.filter(email => 
        new Date(email.date) >= cutoffDate
      );

      // Extract business metrics
      const metrics = await this.extractBusinessMetrics(recentEmails);
      
      // Generate AI summary
      const summary = await this.generateSummary(metrics, recentEmails, hoursBack);
      
      // Generate insights and recommendations
      const insights = this.generateInsights(metrics, recentEmails);
      const recommendations = this.generateRecommendations(metrics, recentEmails);

      return {
        date: new Date(),
        period: "24h",
        metrics,
        summary,
        insights,
        recommendations
      };
    } catch (error) {
      console.error("Error generating daily digest:", error);
      throw error;
    }
  }

  private async extractBusinessMetrics(emails: any[]): Promise<BusinessMetrics> {
    const salesOrders = await this.extractSalesMetrics(emails);
    const emailCounts = this.extractEmailMetrics(emails);
    
    return {
      salesOrders,
      emailCounts,
      customMetrics: {}
    };
  }

  private async extractSalesMetrics(emails: any[]): Promise<BusinessMetrics['salesOrders']> {
    // Filter sales/order emails
    const salesEmails = emails.filter(email => 
      this.isSalesEmail(email.subject, email.body, email.senderEmail)
    );

    let totalValue = 0;
    let count = 0;
    const products: Record<string, number> = {};
    let currency = "£";

    for (const email of salesEmails) {
      try {
        // Extract order data using AI
        const orderData = await this.parseOrderEmail(email);
        if (orderData) {
          count++;
          totalValue += orderData.value;
          
          // Count products
          orderData.products.forEach(product => {
            products[product.name] = (products[product.name] || 0) + product.quantity;
          });
        }
      } catch (error) {
        console.error("Error parsing order email:", error);
        // Fallback: simple pattern matching
        const fallbackData = this.fallbackOrderParsing(email);
        if (fallbackData) {
          count++;
          totalValue += fallbackData.value;
        }
      }
    }

    return {
      count,
      totalValue,
      currency,
      products,
      averageOrderValue: count > 0 ? totalValue / count : 0
    };
  }

  private isSalesEmail(subject: string, body: string, senderEmail: string): boolean {
    const salesKeywords = [
      "order", "purchase", "sale", "payment", "invoice", "receipt", 
      "order confirmation", "payment received", "new order", "order #"
    ];
    
    const salesDomains = [
      "shopify", "woocommerce", "stripe", "paypal", 
      "square", "order", "shop", "store"
    ];

    const content = (subject + " " + (body || "")).toLowerCase();
    
    // Check for sales keywords
    const hasKeywords = salesKeywords.some(keyword => content.includes(keyword));
    
    // Check for sales-related sender domains
    const hasSalesDomain = salesDomains.some(domain => 
      senderEmail.toLowerCase().includes(domain)
    );
    
    // Check for order patterns
    const hasOrderPattern = /order\s*#?\s*\d+|invoice\s*#?\s*\d+|£\d+\.\d{2}|\$\d+\.\d{2}/i.test(content);
    
    return hasKeywords || hasSalesDomain || hasOrderPattern;
  }

  private async parseOrderEmail(email: any): Promise<{ value: number; products: Array<{ name: string; quantity: number }> } | null> {
    try {
      const prompt = `Parse this order email and extract:
1. Total order value (number only, no currency)
2. Products and quantities

Email Subject: ${email.subject}
Email Body: ${email.body?.substring(0, 1000) || "No body"}

Return JSON format:
{
  "value": 123.45,
  "products": [
    {"name": "Smoked Oak Flooring", "quantity": 2},
    {"name": "Walnut Planks", "quantity": 1}
  ]
}

If no clear order data is found, return null.`;

      const response = await openaiService.generateChatResponse([
        { role: "user", content: prompt }
      ], "You are a data extraction expert. Extract order information from emails accurately. Return only valid JSON or null.");

      try {
        const parsed = JSON.parse(response);
        if (parsed && typeof parsed.value === 'number' && Array.isArray(parsed.products)) {
          return parsed;
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
      }
      
      return null;
    } catch (error) {
      console.error("Error in AI order parsing:", error);
      return null;
    }
  }

  private fallbackOrderParsing(email: any): { value: number } | null {
    const content = email.subject + " " + (email.body || "");
    
    // Try to extract monetary values
    const priceMatches = content.match(/£(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
    if (priceMatches && priceMatches.length > 0) {
      // Take the largest value found (likely the total)
      const values = priceMatches.map(match => 
        parseFloat(match.replace('£', '').replace(',', ''))
      );
      const maxValue = Math.max(...values);
      
      if (maxValue > 0 && maxValue < 10000) { // Reasonable order range
        return { value: maxValue };
      }
    }
    
    return null;
  }

  private extractEmailMetrics(emails: any[]): BusinessMetrics['emailCounts'] {
    const byCategory: Record<string, number> = {};
    const senderCounts: Record<string, number> = {};

    emails.forEach(email => {
      // Count by category
      byCategory[email.category] = (byCategory[email.category] || 0) + 1;
      
      // Count by sender
      senderCounts[email.senderEmail] = (senderCounts[email.senderEmail] || 0) + 1;
    });

    // Get top 5 senders
    const topSenders = Object.entries(senderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sender, count]) => ({ sender, count }));

    return {
      total: emails.length,
      byCategory,
      topSenders
    };
  }

  private async generateSummary(metrics: BusinessMetrics, emails: any[], hoursBack: number): Promise<string> {
    try {
      const prompt = `Generate a concise daily business summary based on this email data:

**Sales Performance (${hoursBack}h)**:
- ${metrics.salesOrders.count} orders
- Total: ${metrics.salesOrders.currency}${metrics.salesOrders.totalValue.toFixed(2)}
- Average order: ${metrics.salesOrders.currency}${metrics.salesOrders.averageOrderValue.toFixed(2)}
- Products: ${Object.entries(metrics.salesOrders.products).map(([name, qty]) => `${qty}x ${name}`).join(", ")}

**Email Activity**:
- ${metrics.emailCounts.total} total emails
- Categories: ${Object.entries(metrics.emailCounts.byCategory).map(([cat, count]) => `${count} ${cat}`).join(", ")}
- Top senders: ${metrics.emailCounts.topSenders.slice(0, 3).map(s => s.sender).join(", ")}

Write a friendly, business-focused summary in 2-3 sentences. Highlight key achievements and notable patterns.`;

      const summary = await openaiService.generateChatResponse([
        { role: "user", content: prompt }
      ], "You are a business analyst creating daily summaries. Be concise and focus on actionable insights.");

      return summary || this.generateFallbackSummary(metrics, hoursBack);
    } catch (error) {
      console.error("Error generating AI summary:", error);
      return this.generateFallbackSummary(metrics, hoursBack);
    }
  }

  private generateFallbackSummary(metrics: BusinessMetrics, hoursBack: number): string {
    const { salesOrders, emailCounts } = metrics;
    
    if (salesOrders.count > 0) {
      const topProduct = Object.entries(salesOrders.products)
        .sort((a, b) => b[1] - a[1])[0];
      
      return `In the last ${hoursBack} hours: ${salesOrders.count} orders totaling ${salesOrders.currency}${salesOrders.totalValue.toFixed(2)}${topProduct ? `, with ${topProduct[1]} ${topProduct[0]} being the top seller` : ""}. Processed ${emailCounts.total} emails across all categories.`;
    }
    
    return `In the last ${hoursBack} hours: Processed ${emailCounts.total} emails. ${emailCounts.byCategory.Draft || 0} emails need your attention.`;
  }

  private generateInsights(metrics: BusinessMetrics, emails: any[]): string[] {
    const insights: string[] = [];
    
    // Sales insights
    if (metrics.salesOrders.count > 0) {
      if (metrics.salesOrders.averageOrderValue > 100) {
        insights.push(`Strong average order value of ${metrics.salesOrders.currency}${metrics.salesOrders.averageOrderValue.toFixed(2)}`);
      }
      
      const topProduct = Object.entries(metrics.salesOrders.products)
        .sort((a, b) => b[1] - a[1])[0];
      if (topProduct) {
        insights.push(`${topProduct[0]} is your bestselling product with ${topProduct[1]} orders`);
      }
    }
    
    // Email insights
    if (metrics.emailCounts.byCategory.Draft > 5) {
      insights.push(`High volume of action-required emails (${metrics.emailCounts.byCategory.Draft}) may need attention`);
    }
    
    return insights;
  }

  private generateRecommendations(metrics: BusinessMetrics, emails: any[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.salesOrders.count > 10) {
      recommendations.push("Consider setting up automated order processing for high-volume days");
    }
    
    if (metrics.emailCounts.byCategory.Draft > metrics.emailCounts.byCategory.FYI) {
      recommendations.push("Focus on clearing action-required emails to maintain workflow efficiency");
    }
    
    return recommendations;
  }

  async saveDailyDigest(userId: string, digestData: DailyDigestData): Promise<void> {
    try {
      await storage.saveDailyDigest({
        userId,
        date: digestData.date,
        totalEmails: digestData.metrics.emailCounts.total,
        salesCount: digestData.metrics.salesOrders.count,
        salesTotal: `${digestData.metrics.salesOrders.currency}${digestData.metrics.salesOrders.totalValue.toFixed(2)}`,
        productBreakdown: digestData.metrics.salesOrders.products,
        keyMetrics: {
          averageOrderValue: digestData.metrics.salesOrders.averageOrderValue,
          topSenders: digestData.metrics.emailCounts.topSenders,
          insights: digestData.insights,
          recommendations: digestData.recommendations
        },
        summary: digestData.summary
      });
    } catch (error) {
      console.error("Error saving daily digest:", error);
      throw error;
    }
  }

  async getUserDigestHistory(userId: string, days: number = 7): Promise<any[]> {
    try {
      return await storage.getUserDailyDigests(userId, days);
    } catch (error) {
      console.error("Error fetching digest history:", error);
      return [];
    }
  }
}

export const digestService = new DigestService();