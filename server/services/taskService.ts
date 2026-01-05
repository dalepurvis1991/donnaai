import { storage } from "../storage";
import { openaiService, TaskDetectionSchema } from "./openaiService";
import { gmailApiService } from "./gmailApiService";
import { z } from "zod";

export interface TaskDetectionResult {
  isTask: boolean;
  confidence: number;
  title?: string;
  description?: string;
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "proposed" | "pending" | "assigned" | "in_progress" | "completed" | "cancelled" | "verified";
  supplier?: string;
  amount?: number;
  orderNumber?: string;
  stages?: {
    stage: string;
    completed: boolean;
    completedAt?: Date;
    emailId?: number;
  }[];
  reasoning?: string;
  // Enhanced MVP fields
  brief?: {
    whatHappened: string;
    whatNeedsDoing: string;
    constraints?: string;
    suggestedNextStep?: string;
  };
  evidence?: {
    quote: string;
    offsets?: { start: number; end: number };
  };
  entities?: {
    people?: string[];
    orgs?: string[];
    orderRefs?: string[];
    amounts?: number[];
    dates?: string[];
  };
  owner?: "me" | "contact" | "unknown";
  dueDate?: string;
}

export interface TaskUpdate {
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  stages?: {
    stage: string;
    completed: boolean;
    completedAt?: Date;
    emailId?: number;
  }[];
  orderNumber?: string;
  invoiceNumber?: string;
  supplier?: string;
  amount?: number;
  completedAt?: Date;
}

export class TaskService {
  async detectTaskFromEmail(emailId: number, emailContent: any, userId: string): Promise<TaskDetectionResult> {
    try {
      const { subject, body, sender, senderEmail } = emailContent;

      // Get team context for better owner detection
      const team = await storage.getTeamMembers(userId);
      const teamContext = team.map(m => `${m.name} (${m.role}): ${m.responsibilities}`).join("\n");

      const prompt = `
Analyze this email to determine if it represents a business task or job that needs tracking.
Subject: ${subject}
From: ${sender} (${senderEmail})
Body: ${body}

Team Members & Responsibilities:
${teamContext}

Determine if this email indicates a task/job, procurement need, maintenance request, etc.
Extract: Title, Description, Category, Priority, Supplier, Amount, Order Number, Stages.

--- CEO LAYER JOB BRIEF ---
- whatHappened: Context/background
- whatNeedsDoing: Specific action items
- constraints: Deadlines, budget
- suggestedNextStep: Next logical action

--- DELEGATION ---
Identify the best OWNER for this task from the team list above. 
If no one matches well, use "unknown". If it's for the recipient, use "me".

Respond with JSON in TaskDetectionSchema format.`;

      const response = await openaiService.generateStructuredResponse(prompt, "task_detection", {
        type: "json_schema",
        zodSchema: (await import("./openaiService")).TaskDetectionSchema,
        name: "task_detection"
      });

      return {
        isTask: response.isTask || false,
        confidence: Math.max(0, Math.min(1, response.confidence || 0)),
        title: response.title || undefined,
        description: response.description || undefined,
        category: response.category || undefined,
        priority: response.priority || "medium",
        supplier: response.supplier || undefined,
        amount: response.amount || undefined,
        orderNumber: response.orderNumber || undefined,
        stages: (response.stages as any) || [],
        reasoning: response.reasoning,
        brief: response.brief as any,
        evidence: response.evidence as any,
        entities: response.entities as any,
        owner: response.owner as any,
        dueDate: response.dueDate || undefined
      };
    } catch (error) {
      console.error("Error detecting task from email:", error);
      return this.fallbackTaskDetection(emailContent);
    }
  }

  async updateTaskFromEmail(taskId: number, emailContent: any, userId: string): Promise<TaskUpdate | null> {
    try {
      const task = await storage.getTaskById(taskId);
      if (!task) return null;

      const { subject, body, sender, senderEmail } = emailContent;

      const prompt = `
Analyze if this email updates the existing task: "${task.title}".
Current Status: ${task.status}
New Email: ${subject} from ${sender}

If it's an update, provide the new status and updated stages.
Respond with JSON.
`;

      const response = await openaiService.generateStructuredResponse(prompt, "task_update", {
        type: "json_schema",
        zodSchema: (await import("./openaiService")).TaskUpdateSchema,
        name: "task_update"
      });

      if (!response.hasUpdate) return null;

      return {
        status: response.status,
        stages: response.stages.map(s => ({ ...s, completedAt: s.completedAt ? new Date(s.completedAt) : undefined, emailId: s.emailId || undefined })),
        orderNumber: response.orderNumber || undefined,
        invoiceNumber: response.invoiceNumber || undefined,
        amount: response.amount || undefined,
        completedAt: response.completedAt ? new Date(response.completedAt) : undefined
      };
    } catch (error) {
      console.error("Error updating task from email:", error);
      return null;
    }
  }

  async processEmailForTasks(emailId: number, emailContent: any, userId: string): Promise<void> {
    try {
      const existingTasks = await storage.getUserTasks(userId, ["pending", "in_progress", "assigned", "proposed"]);
      const taskDetection = await this.detectTaskFromEmail(emailId, emailContent, userId);

      if (taskDetection.isTask && taskDetection.confidence > 0.7) {
        // ... (existing compaction logic) ...
        const potentialMatch = existingTasks.find(t =>
          t.category === taskDetection.category &&
          t.supplier === taskDetection.supplier &&
          ((taskDetection.title && t.title.toLowerCase().includes(taskDetection.title.toLowerCase())) ||
            (taskDetection.title && taskDetection.title.toLowerCase().includes(t.title.toLowerCase())))
        );

        if (potentialMatch) {
          await storage.updateTask(potentialMatch.id, {
            relatedEmails: [...(potentialMatch.relatedEmails || []), emailId],
            updatedAt: new Date(),
            jobBrief: potentialMatch.jobBrief ? `${potentialMatch.jobBrief}\n\n[Update ${new Date().toLocaleDateString()}]: ${taskDetection.brief?.whatNeedsDoing || "New activity detected."}` : undefined
          });
          return;
        }

        // --- CEO LAYER AUTO-ASSIGNMENT ---
        const prefs = await storage.getUserPreferences(userId);
        const autoAssign = prefs?.autoAssignEnabled || false;
        let finalStatus: any = "proposed";
        let assigneeId: number | null = null;
        let assignmentReason: string | null = null;

        if (autoAssign && taskDetection.confidence > (prefs?.autoApproveThreshold || 0.9)) {
          console.log(`Auto-assigning task for user ${userId}`);
          const team = await storage.getTeamMembers(userId);
          const bestMatch = await this.findBestAssignee(taskDetection, team);

          if (bestMatch) {
            finalStatus = "assigned";
            assigneeId = bestMatch.id;
            assignmentReason = `Auto-assigned based on role: ${bestMatch.role}`;
          }
        }

        await storage.createTask({
          userId,
          title: taskDetection.title!,
          description: taskDetection.description,
          status: finalStatus,
          category: taskDetection.category,
          priority: taskDetection.priority as any,
          detectedFromEmailId: emailId,
          relatedEmails: [emailId],
          autoDetected: true,
          confidence: taskDetection.confidence,
          supplier: taskDetection.supplier,
          amount: taskDetection.amount,
          orderNumber: taskDetection.orderNumber,
          stages: taskDetection.stages as any,
          jobBrief: taskDetection.brief ? `${taskDetection.brief.whatHappened}\n\nObjectives: ${taskDetection.brief.whatNeedsDoing}\n\nConstraints: ${taskDetection.brief.constraints || "None"}\n\nSuggested Next Step: ${taskDetection.brief.suggestedNextStep || "Pending"}` : undefined,
          evidenceQuote: taskDetection.evidence?.quote,
          entities: taskDetection.entities as any,
          taskOwner: taskDetection.owner as any,
          assigneeId,
          assignmentReasoning: assignmentReason,
          dueDate: taskDetection.dueDate ? new Date(taskDetection.dueDate) : undefined
        });

        console.log(`Created ${finalStatus} task: ${taskDetection.title}`);
        return;
      }

      // Check for status updates on existing tasks if not a brand new task match
      for (const task of existingTasks) {
        const update = await this.updateTaskFromEmail(task.id, emailContent, userId);

        if (update) {
          await storage.updateTask(task.id, {
            ...update,
            relatedEmails: [...(task.relatedEmails || []), emailId],
            updatedAt: new Date()
          });

          // Add system comment
          await storage.createTaskComment({
            taskId: task.id,
            userId,
            content: `Task updated from email: ${emailContent.subject}`,
            isSystemGenerated: true,
            emailId
          });

          console.log(`Updated task ${task.id}: ${task.title}`);
        }
      }
    } catch (error) {
      console.error("Error processing email for tasks:", error);
    }
  }

  private fallbackTaskDetection(emailContent: any): TaskDetectionResult {
    const { subject, body } = emailContent;
    const content = `${subject} ${body}`.toLowerCase();

    // Simple keyword detection
    const taskKeywords = [
      'need to', 'require', 'order', 'buy', 'purchase', 'fix', 'repair',
      'install', 'deliver', 'quote', 'estimate', 'maintenance', 'replace'
    ];

    const hasTaskKeywords = taskKeywords.some(keyword => content.includes(keyword));

    if (hasTaskKeywords) {
      return {
        isTask: true,
        confidence: 0.6,
        title: subject.substring(0, 100),
        description: body.substring(0, 500),
        category: "general",
        priority: "medium"
      };
    }

    return { isTask: false, confidence: 0 };
  }

  async getTaskSummary(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }> {
    try {
      const tasks = await storage.getUserTasks(userId);
      const now = new Date();

      return {
        total: tasks.length,
        pending: tasks.filter(t => t.status === "pending").length,
        inProgress: tasks.filter(t => t.status === "in_progress").length,
        completed: tasks.filter(t => t.status === "completed").length,
        overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "completed").length
      };
    } catch (error) {
      console.error("Error getting task summary:", error);
      return { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 };
    }
  }

  async assignTask(taskId: number, assigneeId: number, assigneeEmail: string, assigneeName: string, userId: string): Promise<boolean> {
    try {
      const task = await storage.getTaskById(taskId);
      if (!task) throw new Error("Task not found");

      const user = await storage.getUser(userId);
      if (!user) throw new Error("User not found");

      // Generating email body
      const subject = `New Task: ${task.title}`;
      const body = `Hi ${assigneeName},\n\nI've assigned you a new task:\n\n${task.title}\n\nDescription:\n${task.description || "No description provided."}\n\nPriority: ${task.priority}\nDue Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "None"}\n\nPlease reply to this email when you have an update.\n\nBest,\nDonna AI`;

      if (user.googleAccessToken) {
        await gmailApiService.sendEmail(user, assigneeEmail, subject, body);
      } else {
        console.log("No Google token for assignment email - skipping email send (Outlook send not yet implemented)");
      }

      await storage.updateTask(taskId, {
        assigneeId: assigneeId,
        status: "in_progress",
        wasAutoAssigned: false,
        taskOwner: "contact",
        updatedAt: new Date()
      });

      await storage.createTaskComment({
        taskId: taskId,
        userId: userId,
        content: `Assigned to ${assigneeName} (${assigneeEmail})`,
        isSystemGenerated: true
      });

      console.log(`Task ${taskId} assigned to ${assigneeName}`);
      return true;
    } catch (error) {
      console.error("Error assigning task:", error);
      return false;
    }
  }

  private async findBestAssignee(task: TaskDetectionResult, team: any[]): Promise<any | null> {
    if (team.length === 0) return null;

    for (const member of team) {
      if (task.category && member.responsibilities.toLowerCase().includes(task.category.toLowerCase())) {
        return member;
      }
      if (task.title && member.role.toLowerCase().includes(task.title.toLowerCase().split(' ')[0])) {
        return member;
      }
    }
    return team[0];
  }
}

export const taskService = new TaskService();