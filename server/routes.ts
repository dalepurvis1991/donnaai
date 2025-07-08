import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { gmailApiService } from "./services/gmailApiService";
import { calendarApiService } from "./services/calendarApiService";
import { insertEmailSchema, insertCalendarEventSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupGoogleAuth } from "./googleOAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Replit authentication
  await setupAuth(app);
  
  // Set up Google OAuth for Gmail/Calendar access
  setupGoogleAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Auth user check - Session:', {
        hasUser: !!req.user,
        hasClaims: !!req.user?.claims,
        userId: req.user?.claims?.sub
      });
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
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

  // Refresh emails from Gmail
  app.post("/api/emails/refresh", isAuthenticated, async (req: any, res) => {
    try {
      console.log('Email refresh request - User check:', {
        hasUser: !!req.user,
        userId: req.user?.claims?.sub
      });
      
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
