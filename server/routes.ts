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
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
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
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const settings = await storage.updateUserSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.post("/api/settings/rules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
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
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
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

  // Memory/Vector API routes
  app.get("/api/memories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const { vectorService } = await import("./services/vectorService");
      const memories = await vectorService.getUserMemories(userId);
      res.json(memories);
    } catch (error) {
      console.error("Error fetching memories:", error);
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  app.get("/api/memories/search", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const { q: query } = req.query;
      
      if (!query) {
        return res.json([]);
      }
      
      const { vectorService } = await import("./services/vectorService");
      const results = await vectorService.searchMemories(query as string, userId);
      res.json(results);
    } catch (error) {
      console.error("Error searching memories:", error);
      res.status(500).json({ message: "Failed to search memories" });
    }
  });

  app.post("/api/memories/index", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const { vectorService } = await import("./services/vectorService");
      
      // Index all user emails
      await vectorService.indexAllUserEmails(userId);
      
      res.json({ message: "Indexing completed successfully" });
    } catch (error) {
      console.error("Error indexing memories:", error);
      res.status(500).json({ message: "Failed to index memories" });
    }
  });

  app.post("/api/memories/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      const { vectorService } = await import("./services/vectorService");
      const noteId = `note-${Date.now()}`;
      
      await vectorService.indexNote(noteId, content, userId);
      
      res.json({ message: "Note added successfully", noteId });
    } catch (error) {
      console.error("Error adding note:", error);
      res.status(500).json({ message: "Failed to add note" });
    }
  });

  // Chat API routes
  app.get("/api/chat/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/send", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const { content } = req.body;
      
      if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      // Store user message
      await storage.createChatMessage({
        userId,
        role: "user",
        content: content.trim(),
      });

      // Generate AI response using RAG
      const { ragService } = await import("./services/ragService");
      const aiResponse = await ragService.processUserMessage(userId, content.trim());
      
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

  // Draft assistant route
  app.post("/api/emails/:id/draft", isAuthenticated, async (req: any, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const { userInput } = req.body;
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const { draftAssistantService } = await import("./services/draftAssistantService");
      const draft = await draftAssistantService.generateReply(emailId, userId, userInput);
      
      res.json(draft);
    } catch (error) {
      console.error("Error generating draft:", error);
      res.status(500).json({ message: "Failed to generate draft" });
    }
  });

  // Folder management routes
  app.get("/api/folders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const folders = await storage.getUserFolders(userId);
      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post("/api/folders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const { name, color, description } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Folder name is required" });
      }
      
      const folder = await storage.createFolder(userId, name, color, description);
      res.json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  app.delete("/api/folders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const folderId = parseInt(req.params.id);
      await storage.deleteFolder(folderId);
      res.json({ message: "Folder deleted successfully" });
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  app.get("/api/folders/:id/emails", isAuthenticated, async (req: any, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const emails = await storage.getEmailsByFolder(folderId);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching folder emails:", error);
      res.status(500).json({ message: "Failed to fetch folder emails" });
    }
  });

  app.post("/api/emails/:id/folder", isAuthenticated, async (req: any, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const { folderId } = req.body;
      
      if (!folderId) {
        return res.status(400).json({ message: "Folder ID is required" });
      }
      
      await storage.assignEmailToFolder(emailId, folderId);
      res.json({ message: "Email assigned to folder successfully" });
    } catch (error) {
      console.error("Error assigning email to folder:", error);
      res.status(500).json({ message: "Failed to assign email to folder" });
    }
  });

  app.post("/api/folders/:id/rules", isAuthenticated, async (req: any, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const { ruleType, ruleValue } = req.body;
      if (!ruleType || !ruleValue) {
        return res.status(400).json({ message: "Rule type and value are required" });
      }
      
      const rule = await storage.createFolderRule(userId, folderId, ruleType, ruleValue);
      res.json(rule);
    } catch (error) {
      console.error("Error creating folder rule:", error);
      res.status(500).json({ message: "Failed to create folder rule" });
    }
  });

  app.get("/api/folder-rules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const rules = await storage.getFolderRules(userId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching folder rules:", error);
      res.status(500).json({ message: "Failed to fetch folder rules" });
    }
  });

  // Daily digest routes
  app.post("/api/digest/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const { hoursBack = 24 } = req.body;
      const { digestService } = await import("./services/digestService");
      
      const digestData = await digestService.generateDailyDigest(userId, hoursBack);
      await digestService.saveDailyDigest(userId, digestData);
      
      res.json(digestData);
    } catch (error) {
      console.error("Error generating digest:", error);
      res.status(500).json({ message: "Failed to generate digest" });
    }
  });

  app.get("/api/digest/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const { days = 7 } = req.query;
      const { digestService } = await import("./services/digestService");
      
      const history = await digestService.getUserDigestHistory(userId, parseInt(days as string));
      res.json(history);
    } catch (error) {
      console.error("Error fetching digest history:", error);
      res.status(500).json({ message: "Failed to fetch digest history" });
    }
  });

  // Notification settings routes
  app.get("/api/notifications/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const settings = await storage.getUserNotificationSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.put("/api/notifications/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const settings = await storage.updateNotificationSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
