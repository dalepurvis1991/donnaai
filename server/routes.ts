import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { gmailApiService } from "./services/gmailApiService";
import { calendarApiService } from "./services/calendarApiService";
import { insertEmailSchema, insertCalendarEventSchema } from "@shared/schema";
import { setupGoogleOnlyAuth, isAuthenticated } from "./googleOnlyAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add debug logging for all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} from ${req.hostname}`);
    next();
  });
  
  // Set up Google-only authentication 
  setupGoogleOnlyAuth(app);

  // Debug route to test callback URL
  app.get('/api/test-callback', (req, res) => {
    res.json({ 
      message: 'Callback endpoint is reachable',
      hostname: req.hostname,
      url: req.url,
      query: req.query
    });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user; // User is already loaded by isAuthenticated middleware
      console.log('User found:', {
        id: user.id,
        email: user.email,
        hasGoogleToken: !!user.googleAccessToken
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });


  // Health check endpoint
  app.get("/api/health", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.json({ 
          status: "ok", 
          emailConnection: "no_user" 
        });
      }
      
      const emailConnected = await gmailApiService.testConnection(user);
      const calendarConnected = await calendarApiService.testConnection(user);
      res.json({ 
        status: "ok", 
        emailConnection: emailConnected ? "connected" : "disconnected",
        calendarConnection: calendarConnected ? "connected" : "disconnected"
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

  // Get email statistics
  app.get("/api/emails/stats", async (req, res) => {
    try {
      const stats = await storage.getEmailStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get email statistics" 
      });
    }
  });

  // Refresh emails from Gmail
  app.post("/api/emails/refresh", isAuthenticated, async (req: any, res) => {
    try {
      console.log('Email refresh request - User check:', {
        hasUser: !!req.user,
        userId: req.user?.id
      });
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log('User not found in database:', userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('User for email refresh:', {
        id: user.id,
        hasGoogleToken: !!user.googleAccessToken,
        hasRefreshToken: !!user.googleRefreshToken
      });

      if (!user.googleAccessToken) {
        return res.status(400).json({ 
          message: "Gmail access not granted. Please log in again to grant Gmail permission." 
        });
      }

      // Clear existing emails
      await storage.clearEmails();
      
      // Fetch new emails from Gmail API
      const emailCount = req.body?.count || 50; // Default 50, allow user preference
      const newEmails = await gmailApiService.fetchUserEmails(user, emailCount);
      
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
      console.error('Email refresh error:', error);
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

  // Calendar routes
  app.get("/api/calendar/events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const events = await storage.getCalendarEvents(userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch calendar events" 
      });
    }
  });

  app.post("/api/calendar/refresh", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.googleAccessToken) {
        return res.status(400).json({ 
          message: "Calendar access not granted. Please log in again to grant calendar permission." 
        });
      }

      // Clear existing events
      await storage.clearCalendarEvents(userId);
      
      // Fetch new calendar events
      const daysAhead = req.body?.daysAhead || 7;
      const newEvents = await calendarApiService.fetchUserEvents(user, daysAhead);
      
      // Store new events
      for (const event of newEvents) {
        await storage.createCalendarEvent(event);
      }

      res.json({ 
        message: "Calendar events refreshed successfully", 
        count: newEvents.length 
      });
    } catch (error) {
      console.error('Calendar refresh error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to refresh calendar events" 
      });
    }
  });

  // Settings API routes
  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.updateUserSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.post("/api/settings/rules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type, value, category, confidence } = req.body;
      
      const settings = await storage.getUserSettings(userId);
      if (type === "sender") {
        settings.emailRules.senderRules.push({ email: value, category, confidence });
      } else if (type === "subject") {
        settings.emailRules.subjectRules.push({ pattern: value, category, confidence });
      }
      
      const updated = await storage.updateUserSettings(userId, settings);
      res.json(updated);
    } catch (error) {
      console.error("Error creating rule:", error);
      res.status(500).json({ message: "Failed to create rule" });
    }
  });

  // Email detail and management routes
  app.get("/api/emails/:id", async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const email = await storage.getEmailById(emailId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      res.json(email);
    } catch (error) {
      console.error("Error fetching email:", error);
      res.status(500).json({ message: "Failed to fetch email" });
    }
  });

  app.put("/api/emails/:id/categorize", isAuthenticated, async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const { category } = req.body;
      const updated = await storage.updateEmailCategory(emailId, category);
      res.json(updated);
    } catch (error) {
      console.error("Error updating email category:", error);
      res.status(500).json({ message: "Failed to update email category" });
    }
  });

  app.post("/api/emails/:id/reply", isAuthenticated, async (req: any, res) => {
    try {
      const { to, subject, body } = req.body;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.googleAccessToken) {
        return res.status(401).json({ message: "Gmail access required" });
      }

      // TODO: Implement actual Gmail API send functionality
      // For now, we'll simulate sending
      console.log(`Simulating email send: ${subject} to ${to}`);
      
      res.json({ message: "Reply sent successfully" });
    } catch (error) {
      console.error("Error sending reply:", error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  // Chat API routes
  app.get("/api/chat/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/send", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { content } = req.body;
      
      // Store user message
      await storage.createChatMessage({
        userId,
        role: "user",
        content,
      });

      // Generate AI response using RAG
      const { ragService } = await import("./services/ragService");
      const aiResponse = await ragService.processUserMessage(userId, content);
      
      // Store AI response
      await storage.createChatMessage({
        userId,
        role: "assistant",
        content: aiResponse,
      });

      res.json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
