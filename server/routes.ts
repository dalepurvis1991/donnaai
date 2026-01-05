import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { gmailApiService } from "./services/gmailApiService";
import { outlookApiService } from "./services/outlookApiService";
import { calendarApiService } from "./services/calendarApiService";
import { insertEmailSchema, insertCalendarEventSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./auth";
import { digestService } from "./services/digestService";
import { taskService } from "./services/taskService";
import { briefingService } from "./services/briefingService";
import { correlationService } from "./services/correlationService";
import { vectorService } from "./services/vectorService";

import { requirePlan, FEATURES, PLANS } from "./middleware/tierMiddleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add debug logging for all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} from ${req.hostname}`);
    next();
  });

  // Authentication is set up in index.ts via setupAuth

  // Debug route to test callback URL
  app.get('/api/test-callback', (req, res) => {
    res.json({
      message: 'Callback endpoint is reachable',
      hostname: req.hostname,
      url: req.url,
      query: req.query
    });
  });

  // FYI Digest Routes
  app.post('/api/digests/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await digestService.generateFyiDigests(userId);
      res.json({ message: "FYI Digests generated" });
    } catch (error) {
      console.error("Error generating digests:", error);
      res.status(500).json({ message: "Failed to generate digests" });
    }
  });

  app.get('/api/digests/fyi', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const digests = await storage.getFyiDigests(userId, 'active');
      res.json(digests);
    } catch (error) {
      console.error("Error fetching digests:", error);
      res.status(500).json({ message: "Failed to fetch digests" });
    }
  });

  app.post('/api/digests/fyi/:id/dismiss', isAuthenticated, async (req: any, res) => {
    try {
      await storage.updateFyiDigest(parseInt(req.params.id), { status: 'dismissed' });
      res.json({ message: "Digest dismissed" });
    } catch (error) {
      console.error("Error dismissing digest:", error);
      res.status(500).json({ message: "Failed to dismiss digest" });
    }
  });

  // Briefing & AI Learning routes
  app.get('/api/briefing', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not identified" });
      }
      const briefing = await briefingService.generateDailyBriefing(userId);
      res.json(briefing);
    } catch (error) {
      console.error("Error fetching briefing:", error);
      res.status(500).json({ message: "Failed to generate briefing" });
    }
  });

  app.post('/api/agent/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || (req.session as any)?.userId;
      const { trigger, correction } = req.body;
      if (!userId) return res.status(401).json({ message: "User not identified" });

      await briefingService.handleUserFeedback(userId, trigger, correction);
      res.json({ message: "Feedback recorded. My thinking has been updated." });
    } catch (error) {
      console.error("Error recording feedback:", error);
      res.status(500).json({ message: "Failed to register feedback" });
    }
  });

  // Task management routes
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
      const task = await storage.createTask({ ...req.body, userId });
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.post('/api/tasks/:id/assign', isAuthenticated, requirePlan(FEATURES.DELEGATIONS), async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { assigneeId } = req.body;
      const userId = req.user.id;

      if (!assigneeId) {
        return res.status(400).json({ message: "Assignee ID required" });
      }

      // Fetch team member details
      const teamMembers = await storage.getTeamMembers(userId);
      const assignee = teamMembers.find(t => t.id === assigneeId);

      if (!assignee) {
        return res.status(404).json({ message: "Team member not found" });
      }

      if (!assignee.email) {
        return res.status(400).json({ message: "Team member has no email address" });
      }

      await taskService.assignTask(taskId, assigneeId, assignee.email, assignee.name, userId);
      res.json({ message: "Task assigned successfully" });
    } catch (error) {
      console.error("Error assigning task:", error);
      res.status(500).json({ message: "Failed to assign task" });
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
      const userId = req.user.id;
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
      const userId = req.user.id;
      const { emailId, emailContent } = req.body;

      await taskService.processEmailForTasks(emailId, emailContent, userId);
      res.json({ message: "Email processed for tasks" });
    } catch (error) {
      console.error("Error processing email for tasks:", error);
      res.status(500).json({ message: "Failed to process email" });
    }
  });

  // ============================================
  // DEBUG: Test team member insert (REMOVE IN PRODUCTION)
  // ============================================
  app.get('/api/test-team-insert', async (req, res) => {
    try {
      // First ensure demo user exists
      const demoUser = await storage.upsertUser({
        id: 'demo-user-123',
        email: 'demo@donnaai.co.uk',
        firstName: 'Demo',
        lastName: 'User',
        googleAccessToken: '',
        googleRefreshToken: ''
      });
      console.log("Demo user verified:", demoUser.id);

      // Attempt to create a team member
      const member = await storage.createTeamMember({
        userId: 'demo-user-123',
        name: 'Test Member',
        email: 'test@example.com',
        jobTitle: 'Tester',
        role: 'testing',
        responsibilities: 'Testing the team member creation',
        skills: ['testing', 'debugging'],
        signOffLimit: 500,
        isActive: true
      });

      res.json({ success: true, member });
    } catch (error: any) {
      console.error("Test insert error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack?.split('\n').slice(0, 5)
      });
    }
  });

  // ============================================
  // TEAM MEMBER ROUTES
  // ============================================

  // Get all team members for the user
  app.get('/api/team-members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
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
  app.post('/api/team-members', isAuthenticated, requirePlan(FEATURES.DELEGATIONS), async (req: any, res) => {
    try {
      // Get userId from multiple possible sources (Google OAuth or demo login)
      const userId = req.user.id;
      console.log("Creating team member for userId:", userId);
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      if (!userId) {
        console.error("No userId found in request");
        return res.status(401).json({ message: "User not authenticated" });
      }

      const memberData = {
        ...req.body,
        userId,
        isActive: true
      };
      console.log("Member data to insert:", JSON.stringify(memberData, null, 2));

      const member = await storage.createTeamMember(memberData);
      console.log("Team member created successfully:", member.id);
      res.json(member);
    } catch (error: any) {
      console.error("Error creating team member:", error);
      console.error("Error message:", error.message);
      res.status(500).json({ message: "Failed to create team member", error: error.message });
    }
  });

  // Update a team member
  app.put('/api/team-members/:id', isAuthenticated, requirePlan(FEATURES.DELEGATIONS), async (req: any, res) => {
    try {
      const member = await storage.updateTeamMember(parseInt(req.params.id), req.body);
      res.json(member);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ message: "Failed to update team member" });
    }
  });

  // Delete a team member
  app.delete('/api/team-members/:id', isAuthenticated, requirePlan(FEATURES.DELEGATIONS), async (req: any, res) => {
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
  // DECISION QUEUE ROUTES
  // ============================================

  app.get('/api/decisions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const status = req.query.status as string || 'pending';
      const decisionList = await storage.getDecisions(userId, status);
      res.json(decisionList);
    } catch (error) {
      console.error("Error fetching decisions:", error);
      res.status(500).json({ message: "Failed to fetch decisions" });
    }
  });

  app.post('/api/decisions/:id/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const decisionId = parseInt(req.params.id);
      const { status, feedback } = req.body;
      const userId = req.user.id;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const decision = await storage.getDecisionById(decisionId);
      if (!decision) return res.status(404).json({ message: "Decision not found" });

      const updated = await storage.updateDecision(decisionId, {
        status,
        resolvedAt: new Date(),
        decisionTaken: feedback // Use decisionTaken field for feedback
      });

      // Business Logic Hook: What happens after approval?
      if (status === 'approved') {
        const metadata = decision.metadata as any;
        if (decision.type === 'task_approval' && metadata?.emailId) {
          await taskService.processEmailForTasks(metadata.emailId, {}, userId);
        }
      }

      const meta = decision.metadata as any;
      await storage.createAuditLog(userId, `Decision ${status}`, `Resolved decision ${decisionId}: ${decision.summary}`, meta?.emailId, meta?.taskId, decisionId);

      res.json(updated);
    } catch (error) {
      console.error("Error resolving decision:", error);
      res.status(500).json({ message: "Failed to resolve decision" });
    }
  });

  // ============================================
  // ORCHESTRATOR DASHBOARD ROUTES
  // ============================================

  app.get('/api/orchestrator/brief', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const today = new Date();

      // Fetch data for the brief
      // Note: we can optimize this with specific count queries later
      const [emails, pendingDecisions, tasks] = await Promise.all([
        storage.getEmails(userId),
        storage.getDecisions(userId, 'pending'),
        storage.getUserTasks(userId)
      ]);

      const unreadCount = emails.filter(e => !e.isRead).length;
      const activeTasks = tasks.filter(t => t.status !== 'completed');

      const brief = {
        donnaVoice: `Here is your summary for ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
        priorities: pendingDecisions.slice(0, 3).map(d => ({
          id: d.id,
          title: d.summary || "Pending Decision",
          type: d.type || "review",
          level: d.priority || "medium"
        })),
        decisionsCount: pendingDecisions.length,
        delegationsCount: activeTasks.length,
        emailCount: unreadCount,
        // Also pass raw priorities if the UI expects 'activePriorities'
        activePriorities: pendingDecisions.slice(0, 5)
      };

      res.json(brief);
    } catch (error) {
      console.error("Error fetching orchestrator brief:", error);
      res.status(500).json({ message: "Failed to generate brief" });
    }
  });

  // ============================================
  // USER PREFERENCES ROUTES
  // ============================================

  // Get user preferences
  app.get('/api/user-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      plan: (req.user as any)?.planType,
      sessionData: session ? Object.keys(session) : []
    });
  });

  // Billing / Trial Routes
  app.post('/api/billing/start-trial', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.planType !== PLANS.FREE) {
        return res.status(400).json({ message: "User is already on a plan or trial" });
      }

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 days from now

      const updatedUser = await storage.upsertUser({
        ...user,
        planType: PLANS.TRIAL,
        trialEndsAt
      });

      res.json({
        message: "Trial started successfully",
        planType: updatedUser.planType,
        trialEndsAt: updatedUser.trialEndsAt
      });
    } catch (error) {
      console.error("Error starting trial:", error);
      res.status(500).json({ message: "Failed to start trial" });
    }
  });

  // Orchestrator Briefing Endpoint
  app.get('/api/orchestrator/brief', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const [
        priorities,
        decisions,
        tasks,
        projects,
        stats
      ] = await Promise.all([
        storage.getOperationalMemory(userId, "priorities"),
        storage.getDecisions(userId, "pending"),
        storage.getUserTasks(userId),
        storage.getUsersProjects ? storage.getUsersProjects(userId) : Promise.resolve([]),
        storage.getEmailStats(userId)
      ]);

      const activeDelegations = tasks.filter(t =>
        ['assigned', 'in_progress'].includes(t.status || '')
      );

      res.json({
        priorities: priorities?.value || [],
        decisionsCount: decisions.length,
        delegationsCount: activeDelegations.length,
        projectsCount: Array.isArray(projects) ? projects.length : 0,
        emailCount: stats.totalEmails,
        donnaVoice: `Based on ${stats.totalEmails} emails, ${Array.isArray(projects) ? projects.length : 0} projects, and ${activeDelegations.length} delegations.`
      });
    } catch (error) {
      console.error("Error fetching orchestrator brief:", error);
      res.status(500).json({ message: "Failed to fetch daily brief" });
    }
  });

  // Audit Log Endpoint
  app.get('/api/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const logs = await storage.getAuditLogs(req.user.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get('/api/onboarding/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getUserProfile(userId);
      res.json({
        completed: profile?.onboardingCompleted || false,
        step: profile?.onboardingStep || 0
      });
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
      res.status(500).json({ message: "Failed to fetch onboarding status" });
    }
  });

  app.post('/api/onboarding/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const formData = req.body;

      const profile = await storage.updateUserProfile(userId, {
        ...formData,
        onboardingCompleted: true,
        onboardingStep: 5
      });

      await storage.createAuditLog(userId, "Onboarding Completed", "User finished onboarding wizard");

      res.json(profile);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Demo user for testing (temporary)
  app.post('/api/auth/demo-login', async (req, res) => {
    try {
      const demoUser = await storage.upsertUser({
        id: 'demo-user-123',
        email: 'demo@donnaai.co.uk',
        firstName: 'Demo',
        lastName: 'User',
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
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.json({
          status: "ok",
          emailConnection: "no_user"
        });
      }

      const googleConnected = await gmailApiService.testConnection(user);
      const microsoftConnected = await outlookApiService.testConnection(user);
      const calendarConnected = await calendarApiService.testConnection(user);

      res.json({
        status: "ok",
        googleAccount: googleConnected ? "connected" : "disconnected",
        microsoftAccount: microsoftConnected ? "connected" : "disconnected",
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
        isRead: email.isRead,
      });

      const allEmails = await storage.getEmails(userId);

      res.json({
        fyi: fyiEmails.map(formatEmail),
        draft: draftEmails.map(formatEmail),
        forward: forwardEmails.map(formatEmail),
        totalTraces: allEmails.length
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to get categorized emails"
      });
    }
  });

  // Bulk process emails for learning context
  // Bulk process emails for learning context
  app.post("/api/emails/bulk-process", isAuthenticated, async (req: any, res) => {
    try {
      console.log('Starting bulk process...');
      const userId = req.user.id;
      if (!userId) {
        console.log('Bulk process failed: No user ID');
        return res.status(401).json({ message: "User ID not found" });
      }

      console.log(`Fetching user ${userId}...`);
      const user = await storage.getUser(userId);
      if (!user?.googleAccessToken) {
        console.log('Bulk process failed: No Google token');
        return res.status(400).json({
          message: "Gmail access not granted. Please log in again to grant Gmail permission."
        });
      }

      const { limit = 15, pageToken, reset = false } = req.body;
      const pageSize = Math.min(limit, 50); // Safety cap
      console.log(`Bulk processing batch: size=${pageSize}, reset=${reset}, hasPageToken=${!!pageToken}`);

      // Clear existing emails if requested
      if (reset) {
        console.log('Clearing existing emails (reset requested)...');
        await storage.clearEmails(userId);
      }

      console.log('Importing services...');
      const { gmailApiService } = await import("./services/gmailApiService");
      const { vectorService } = await import("./services/vectorService");

      console.log('Fetching email page from Gmail...');
      const { emails: newEmails, nextPageToken } = await gmailApiService.fetchEmailsPage(user, pageSize, pageToken);
      console.log(`Fetched ${newEmails.length} emails. Next page available: ${!!nextPageToken}`);

      // Store new emails
      console.log('Storing emails in database...');
      const createdEmails = [];
      for (const email of newEmails) {
        const createdEmail = await storage.upsertEmail(email);
        createdEmails.push(createdEmail);
      }
      console.log(`Stored ${createdEmails.length} emails`);

      // Index emails for vector search (consider optimizing this to batch later)
      try {
        if (createdEmails.length > 0) {
          console.log('Indexing emails for vector search...');
          // Ideally we should index only new ones, but for now we index all or trigger user re-index.
          // Since indexAllUserEmails might be heavy, we might want to skip it during intermediate batches if possible.
          // But to ensure "immediate results", we run it.
          await vectorService.indexAllUserEmails(userId);
          console.log('Vector indexing completed');
        }
      } catch (error: any) {
        console.log("Vector indexing warning:", error.message);
        // Don't fail the request if indexing fails
      }

      res.json({
        processed: createdEmails.length,
        nextPageToken,
        message: `Processed ${createdEmails.length} emails`
      });
    } catch (error) {
      console.error('Bulk processing CRITICAL error:', error);
      if (error instanceof Error) {
        console.error('Stack:', error.stack);
      }
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to process emails in bulk",
        details: error instanceof Error ? error.stack : String(error)
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

      // Fetch new emails from Gmail API
      const emailCount = req.body?.count || 50; // Default 50, allow user preference
      const newEmails = await gmailApiService.fetchUserEmails(user, emailCount);

      // Store new emails and detect correlations
      const createdEmails = [];
      for (const email of newEmails) {
        const createdEmail = await storage.upsertEmail(email);
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
      } catch (correlationError: any) {
        console.log("Correlation detection skipped:", correlationError.message);
      }

      const stats = await storage.getEmailStats(userId);

    } catch (error: any) {
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

  app.put("/api/emails/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isRead } = req.body;
      const updatedEmail = await storage.markEmailAsRead(id, isRead);
      res.json(updatedEmail);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to mark email as read"
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
      } catch (error: any) { // Added type annotation for error
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
        detectedFromEmailId: emailId
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

  app.delete("/api/chat/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      await storage.clearChatMessages(userId);
      res.json({ message: "Chat session cleared" });
    } catch (error) {
      console.error("Error clearing chat messages:", error);
      res.status(500).json({ message: "Failed to clear chat session" });
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

  // Memory Vault routes
  app.get("/api/memories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const memories = await vectorService.getUserMemories(userId);
      res.json(memories);
    } catch (error) {
      console.error("Error fetching memories:", error);
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  app.post("/api/memories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const noteId = Date.now().toString();
      await vectorService.indexNote(noteId, content, userId);

      res.json({ message: "Note indexed successfully", id: noteId });
    } catch (error) {
      console.error("Error creating memory note:", error);
      res.status(500).json({ message: "Failed to create memory note" });
    }
  });

  app.get("/api/memories/search", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const results = await vectorService.searchMemories(q as string, userId, 12);
      res.json(results);
    } catch (error) {
      console.error("Error searching memories:", error);
      res.status(500).json({ message: "Failed to search memories" });
    }
  });

  // Privacy & Data Management API routes (Phase 8)
  app.delete("/api/user/data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      await storage.deleteAllUserData(userId);
      await storage.createAuditLog(userId, "Data Deletion", "User requested full data wipe");
      res.json({ message: "All user data has been deleted" });
    } catch (error) {
      console.error("Error deleting user data:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });

  app.delete("/api/user/style-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      await storage.resetUserProfile(userId);
      await storage.createAuditLog(userId, "Profile Reset", "User requested style profile reset");
      res.json({ message: "User style profile has been reset" });
    } catch (error) {
      console.error("Error resetting style profile:", error);
      res.status(500).json({ message: "Failed to reset style profile" });
    }
  });

  app.get("/api/user/audit-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const logs = await storage.getAuditLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/user/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const emails = await storage.getEmails(userId);
      const tasks = await storage.getUserTasks(userId);
      const profile = await storage.getUserProfile(userId);
      const history = await storage.getAuditLogs(userId);

      const exportData = {
        user: {
          id: req.user.id,
          email: req.user.email,
        },
        profile,
        emails,
        tasks,
        history,
        exportedAt: new Date().toISOString()
      };

      await storage.createAuditLog(userId, "Data Export", "User requested full data export");

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=donna-ai-export-${userId}.json`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
