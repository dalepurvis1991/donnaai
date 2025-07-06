import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./services/emailService";
import { insertEmailSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Demo mode toggle endpoint
  app.post("/api/demo/enable", (req, res) => {
    process.env.DEMO_MODE = 'true';
    res.json({ message: "Demo mode enabled", demoMode: true });
  });

  app.post("/api/demo/disable", (req, res) => {
    process.env.DEMO_MODE = 'false';
    res.json({ message: "Demo mode disabled", demoMode: false });
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const isConnected = await emailService.testConnection();
      res.json({ 
        status: "ok", 
        emailConnection: isConnected ? "connected" : "disconnected" 
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        emailConnection: "disconnected",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get email statistics
  app.get("/api/emails/stats", async (req, res) => {
    try {
      const stats = await storage.getEmailStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get email stats" 
      });
    }
  });

  // Get categorized emails
  app.get("/api/emails/categorized", async (req, res) => {
    try {
      const fyiEmails = await storage.getEmailsByCategory('FYI');
      const draftEmails = await storage.getEmailsByCategory('Draft');
      const forwardEmails = await storage.getEmailsByCategory('Forward');

      const formatEmail = (email: any) => ({
        id: email.id,
        subject: email.subject,
        sender: email.sender,
        senderEmail: email.senderEmail,
        date: new Date(email.date).toISOString(),
        category: email.category,
      });

      res.json({
        fyi: fyiEmails.map(formatEmail),
        draft: draftEmails.map(formatEmail),
        forward: forwardEmails.map(formatEmail),
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get categorized emails" 
      });
    }
  });

  // Refresh emails from Gmail
  app.post("/api/emails/refresh", async (req, res) => {
    try {
      // Clear existing emails
      await storage.clearEmails();
      
      // Fetch new emails from Gmail
      const newEmails = await emailService.fetchRecentEmails(10);
      
      // Store new emails
      for (const email of newEmails) {
        await storage.createEmail(email);
      }

      const stats = await storage.getEmailStats();
      
      res.json({ 
        message: "Emails refreshed successfully", 
        count: newEmails.length,
        stats 
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to refresh emails" 
      });
    }
  });

  // Get all emails
  app.get("/api/emails", async (req, res) => {
    try {
      const emails = await storage.getEmails();
      res.json(emails);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get emails" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
