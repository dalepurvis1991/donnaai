import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { gmailApiService } from "./services/gmailApiService";
import { calendarApiService } from "./services/calendarApiService";
import { insertEmailSchema, insertCalendarEventSchema } from "@shared/schema";
import { setupGoogleOnlyAuth, isAuthenticated } from "./googleOnlyAuth";
import { digestService } from "./services/digestService";
import { taskService } from "./services/taskService";
import { correlationService } from "./services/correlationService";

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

  // Task management routes
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const statuses = req.query.status ? [req.query.status] : undefined;
      const tasks = await storage.getUserTasks(userId, statuses);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.createTask({ ...req.body, userId });
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const task = await storage.getTaskById(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const task = await storage.updateTask(parseInt(req.params.id), req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteTask(parseInt(req.params.id));
      res.json({ message: "Task deleted" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.get('/api/tasks/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const comments = await storage.getTaskComments(parseInt(req.params.id));
      res.json(comments);
    } catch (error) {
      console.error("Error fetching task comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/tasks/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const comment = await storage.createTaskComment({
        ...req.body,
        taskId: parseInt(req.params.id),
        userId
      });
      res.json(comment);
    } catch (error) {
      console.error("Error creating task comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Email processing for task detection
  app.post('/api/tasks/process-email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { emailId, emailContent } = req.body;

      await taskService.processEmailForTasks(emailId, emailContent, userId);
      res.json({ message: "Email processed for tasks" });
    } catch (error) {
      console.error("Error processing email for tasks:", error);
      res.status(500).json({ message: "Failed to process email" });
    }
  });

  // ============================================
  // TEAM MEMBER ROUTES
  // ============================================

  // Get all team members for the user
  app.get('/api/team-members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user?.claims?.sub;
      const members = await storage.getTeamMembers(userId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Get a specific team member
  app.get('/api/team-members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const member = await storage.getTeamMemberById(parseInt(req.params.id));
      if (!member) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error fetching team member:", error);
      res.status(500).json({ message: "Failed to fetch team member" });
    }
  });

  // Create a new team member
  app.post('/api/team-members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user?.claims?.sub;
      const member = await storage.createTeamMember({
        ...req.body,
        userId
      });
      res.json(member);
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(500).json({ message: "Failed to create team member" });
    }
  });

  // Update a team member
  app.put('/api/team-members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const member = await storage.updateTeamMember(parseInt(req.params.id), req.body);
      res.json(member);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ message: "Failed to update team member" });
    }
  });

  // Delete a team member
  app.delete('/api/team-members/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteTeamMember(parseInt(req.params.id));
      res.json({ message: "Team member deleted" });
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  // ============================================
  // PROJECT ROUTES
  // ============================================

  // Get all projects for the user
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user?.claims?.sub;
      const projectList = await storage.getProjects(userId);
      res.json(projectList);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get a specific project with its stages and tasks
  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProjectById(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const stages = await storage.getProjectStages(project.id);
      const userId = req.user.id || req.user?.claims?.sub;
      const projectTasks = await storage.getUserTasks(userId);
      const tasksInProject = projectTasks.filter((t: any) => t.projectId === project.id);

      res.json({
        ...project,
        stages,
        tasks: tasksInProject
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Create a new project
  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user?.claims?.sub;
      const project = await storage.createProject({
        ...req.body,
        userId
      });
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Update a project
  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.updateProject(parseInt(req.params.id), req.body);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Delete a project
  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteProject(parseInt(req.params.id));
      res.json({ message: "Project deleted" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // ============================================
  // PROJECT STAGE ROUTES
  // ============================================

  // Get stages for a project
  app.get('/api/projects/:projectId/stages', isAuthenticated, async (req: any, res) => {
    try {
      const stages = await storage.getProjectStages(parseInt(req.params.projectId));
      res.json(stages);
    } catch (error) {
      console.error("Error fetching project stages:", error);
      res.status(500).json({ message: "Failed to fetch stages" });
    }
  });

  // Create a new stage
  app.post('/api/projects/:projectId/stages', isAuthenticated, async (req: any, res) => {
    try {
      const stage = await storage.createProjectStage({
        ...req.body,
        projectId: parseInt(req.params.projectId)
      });
      res.json(stage);
    } catch (error) {
      console.error("Error creating project stage:", error);
      res.status(500).json({ message: "Failed to create stage" });
    }
  });

  // Update a stage
  app.put('/api/projects/:projectId/stages/:stageId', isAuthenticated, async (req: any, res) => {
    try {
      const stage = await storage.updateProjectStage(parseInt(req.params.stageId), req.body);
      res.json(stage);
    } catch (error) {
      console.error("Error updating project stage:", error);
      res.status(500).json({ message: "Failed to update stage" });
    }
  });

  // Delete a stage
  app.delete('/api/projects/:projectId/stages/:stageId', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteProjectStage(parseInt(req.params.stageId));
      res.json({ message: "Stage deleted" });
    } catch (error) {
      console.error("Error deleting project stage:", error);
      res.status(500).json({ message: "Failed to delete stage" });
    }
  });

  // ============================================
  // APPROVAL WORKFLOW ROUTES
  // ============================================

  // Get tasks pending approval
  app.get('/api/approvals/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user?.claims?.sub;
      const pendingTasks = await storage.getPendingApprovalTasks(userId);
      res.json(pendingTasks);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  // Approve a task
  app.post('/api/tasks/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user?.claims?.sub;
      const task = await storage.approveTask(parseInt(req.params.id), userId);
      res.json(task);
    } catch (error) {
      console.error("Error approving task:", error);
      res.status(500).json({ message: "Failed to approve task" });
    }
  });

  // Reject a task
  app.post('/api/tasks/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user?.claims?.sub;
      const task = await storage.rejectTask(parseInt(req.params.id), userId);
      res.json(task);
    } catch (error) {
      console.error("Error rejecting task:", error);
      res.status(500).json({ message: "Failed to reject task" });
    }
  });

  // ============================================
  // USER PREFERENCES ROUTES
  // ============================================

  // Get user preferences
  app.get('/api/user-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user?.claims?.sub;
      const prefs = await storage.getUserPreferences(userId);
      res.json(prefs || {
        autoAssignEnabled: false,
        autoApproveThreshold: 0.95
      });
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  // Update user preferences
  app.put('/api/user-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user?.claims?.sub;
      const prefs = await storage.updateUserPreferences(userId, req.body);
      res.json(prefs);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
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

  // Debug auth status
  app.get('/api/auth/status', (req: any, res) => {
    const session = req.session as any;
    res.json({
      hasSession: !!session,
      sessionId: session?.id,
      userId: session?.userId,
      isAuthenticated: !!session?.userId,
      sessionData: session ? Object.keys(session) : []
    });
  });

  // Demo user for testing (temporary)
  app.post('/api/auth/demo-login', async (req, res) => {
    try {
      const demoUser = await storage.upsertUser({
        id: 'demo-user-123',
        email: 'demo@donnaai.co.uk',
        name: 'Demo User',
        googleAccessToken: '',
        googleRefreshToken: ''
      });

      // Set session
      (req.session as any).userId = demoUser.id;

      console.log('Demo user logged in:', demoUser.email);

      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Session failed' });
        }
        res.json({ success: true, user: demoUser });
      });
    } catch (error) {
      console.error('Demo login error:', error);
      res.status(500).json({ error: 'Demo login failed' });
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
  app.get("/api/emails/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user?.claims?.sub;
      const stats = await storage.getEmailStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to get email statistics"
      });
    }
  });

  // Get categorized emails
  app.get("/api/emails/categorized", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user?.claims?.sub;
      const fyiEmails = await storage.getEmailsByCategory(userId, 'FYI');
      const draftEmails = await storage.getEmailsByCategory(userId, 'Draft');
      const forwardEmails = await storage.getEmailsByCategory(userId, 'Forward');

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

  // Bulk process emails for learning context
  app.post("/api/emails/bulk-process", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const user = await storage.getUser(userId);
      if (!user?.googleAccessToken) {
        return res.status(400).json({
          message: "Gmail access not granted. Please log in again to grant Gmail permission."
        });
      }

      const { limit = 1000 } = req.body;

      // Clear existing emails first
      await storage.clearEmails(userId);

      // Fetch large number of emails for learning context
      const { gmailApiService } = await import("./services/gmailApiService");
      const newEmails = await gmailApiService.fetchUserEmails(user, limit);

      // Store new emails and process for learning
      const createdEmails = [];
      for (const email of newEmails) {
        const createdEmail = await storage.upsertEmail(email);
        createdEmails.push(createdEmail);
      }

      // Index emails for vector search
      try {
        const { vectorService } = await import("./services/vectorService");
        await vectorService.indexAllUserEmails(userId);
      } catch (error) {
        console.log("Vector indexing not available:", error.message);
      }

      res.json({
        message: "Bulk processing completed successfully",
        processed: newEmails.length,
        limit
      });
    } catch (error) {
      console.error('Bulk processing error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to process emails in bulk"
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
      await storage.clearEmails(userId);

      // Fetch new emails from Gmail API
      const emailCount = req.body?.count || 50; // Default 50, allow user preference
      const newEmails = await gmailApiService.fetchUserEmails(user, emailCount);

      // Store new emails and detect correlations
      const createdEmails = [];
      for (const email of newEmails) {
        const createdEmail = await storage.createEmail(email);
        createdEmails.push(createdEmail);
      }

      // Detect correlations for new emails (safely)
      try {
        const existingEmails = await storage.getEmails(userId);
        for (const email of createdEmails) {
          if (email.id && existingEmails.length > 0) {
            const correlations = await correlationService.detectCorrelations(email, existingEmails);
            if (correlations.length > 0) {
              // Validate email IDs exist before creating correlations
              const validCorrelations = correlations.filter(c =>
                existingEmails.some(e => e.id === c.emailId)
              );
              if (validCorrelations.length > 0) {
                await storage.createEmailCorrelations(validCorrelations);
              }
            }
          }
        }
      } catch (correlationError) {
        console.log("Correlation detection skipped:", correlationError.message);
      }

      const stats = await storage.getEmailStats(userId);

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
  app.get("/api/emails", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user?.claims?.sub;
      const emails = await storage.getEmails(userId);
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

  // Generate AI draft reply
  app.post("/api/emails/:id/draft", isAuthenticated, async (req: any, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || req.user?.id;

      const email = await storage.getEmailById(emailId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      // Get business context from RAG service
      let businessContext = "";
      try {
        const { ragService } = await import("./services/ragService");
        const contextEmails = await ragService.searchSimilarEmails(userId, email.subject + " " + email.body, 5);
        businessContext = contextEmails.map(e => `${e.subject}: ${e.body.substring(0, 200)}`).join("\n");
      } catch (error) {
        console.log("RAG context not available:", error.message);
      }

      const { openaiService } = await import("./services/openaiService");
      const draft = await openaiService.generateDraftReply(
        email.subject,
        email.body,
        email.sender,
        businessContext
      );

      res.json(draft);
    } catch (error) {
      console.error("Error generating draft:", error);
      res.status(500).json({ message: "Failed to generate draft" });
    }
  });

  // Create task from email
  app.post("/api/emails/:id/create-task", isAuthenticated, async (req: any, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || req.user?.id;

      const email = await storage.getEmailById(emailId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const task = await storage.createTask({
        userId,
        title: `Follow up: ${email.subject}`,
        description: `Email from ${email.sender}: ${email.body.substring(0, 200)}...`,
        status: "pending",
        priority: "medium",
        category: "email_followup",
        autoDetected: false,
        emailId: emailId
      });

      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
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

  // Bulk email processing route (Pro feature)
  app.post("/api/emails/bulk-process", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const { limit = 1000 } = req.body;

      // Fetch large batch of emails from Gmail
      const emails = await gmailApiService.fetchEmailsInBatch(req.user, limit);

      // Process for RAG system
      const { ragService } = await import("./services/ragService");
      await ragService.processEmailsForLearning(userId, emails);

      res.json({
        processed: emails.length,
        message: `Successfully processed ${emails.length} emails for learning`
      });
    } catch (error) {
      console.error("Error processing bulk emails:", error);
      res.status(500).json({ message: "Failed to process bulk emails" });
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
        timestamp: new Date(),
      });

      // Generate AI response using RAG
      const { ragService } = await import("./services/ragService");
      console.log('Processing chat message for user:', userId);
      const aiResponse = await ragService.processUserMessage(userId, content.trim());

      // Store AI response
      await storage.createChatMessage({
        userId,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
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

  // Tasks API routes  
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const status = req.query.status as string;
      const statuses = status && status !== "all" ? [status] : undefined;
      const tasks = await storage.getUserTasks(userId, statuses);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const taskData = { ...req.body, userId };
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updates = req.body;
      const task = await storage.updateTask(taskId, updates);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      await storage.deleteTask(taskId);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
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

  // Email correlation routes
  app.get("/api/correlations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const groups = await correlationService.getCorrelationGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching correlation groups:", error);
      res.status(500).json({ message: "Failed to fetch correlation groups" });
    }
  });

  app.get("/api/correlations/:groupId", isAuthenticated, async (req: any, res) => {
    try {
      const groupId = req.params.groupId;
      const correlations = await storage.getCorrelationsByGroup(groupId);
      const analysis = await correlationService.analyzeCorrelationGroup(groupId);

      res.json({ correlations, analysis });
    } catch (error) {
      console.error("Error fetching correlation details:", error);
      res.status(500).json({ message: "Failed to fetch correlation details" });
    }
  });

  app.post("/api/correlations", isAuthenticated, async (req: any, res) => {
    try {
      const { emailIds, correlationType, subject } = req.body;

      if (!emailIds || !Array.isArray(emailIds) || emailIds.length < 2) {
        return res.status(400).json({ message: "At least 2 email IDs required" });
      }

      const groupId = await correlationService.createManualCorrelation(
        emailIds,
        correlationType || "manual",
        subject || "Manual correlation"
      );

      res.json({ groupId, message: "Correlation created successfully" });
    } catch (error) {
      console.error("Error creating correlation:", error);
      res.status(500).json({ message: "Failed to create correlation" });
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
