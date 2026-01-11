import { storage } from "../storage";
import { openaiService, TaskDetectionSchema, TaskUpdateSchema } from "./openaiService";

export interface TaskDetectionResult {
  isTask: boolean;
  confidence: number;
  title?: string;
  description?: string;
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
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

      const prompt = `
Analyze this email to determine if it represents a business task or job that needs tracking:

Subject: ${subject}
From: ${sender} (${senderEmail})
Body: ${body}

Determine if this email indicates:
1. A task/job that needs to be done
2. Purchase orders, procurement needs
3. Maintenance requests
4. Administrative tasks
5. Project requirements

Look for keywords like: "need to", "require", "order", "buy", "purchase", "fix", "repair", "install", "deliver", "quote", "estimate"

If this is a task, extract:
- Task title (concise, actionable)
- Description 
- Category (procurement, maintenance, admin, project, etc.)
- Priority (low, medium, high, urgent)
- Supplier name if mentioned
- Amount/cost if mentioned
- Order number if mentioned
- Typical stages for this type of task

Respond with JSON in this format:
{
  "isTask": boolean,
  "confidence": number (0-1),
  "title": "string",
  "description": "string", 
  "category": "string",
  "priority": "low|medium|high|urgent",
  "supplier": "string",
  "amount": number,
  "orderNumber": "string",
  "stages": [
    {"stage": "Request sent", "completed": true},
    {"stage": "Quote received", "completed": false},
    {"stage": "Order placed", "completed": false},
    {"stage": "Invoice received", "completed": false},
    {"stage": "Payment sent", "completed": false}
  ],
  "reasoning": "explanation"
}
`;

      const response = await openaiService.generateStructuredResponse(prompt, "task_detection", {
        type: "json_schema",
        zodSchema: TaskDetectionSchema,
        name: "task_detection"
      });

      return {
        isTask: response.isTask || false,
        confidence: Math.max(0, Math.min(1, response.confidence || 0)),
        title: response.title,
        description: response.description,
        category: response.category,
        priority: response.priority || "medium",
        supplier: response.supplier,
        amount: response.amount,
        orderNumber: response.orderNumber,
        stages: response.stages || [],
        reasoning: response.reasoning
      };
    } catch (error) {
      console.error("Error detecting task from email:", error);
      return this.fallbackTaskDetection(emailContent);
    }
  }

  async updateTaskFromEmail(taskId: number, emailContent: any, userId: string): Promise<TaskUpdate | null> {
    try {
      // Get existing task
      const task = await storage.getTaskById(taskId);
      if (!task) return null;

      const { subject, body, sender, senderEmail } = emailContent;

      const prompt = `
Analyze this email to determine if it updates an existing task:

Current Task:
- Title: ${task.title}
- Description: ${task.description}
- Status: ${task.status}
- Supplier: ${task.supplier || "Unknown"}
- Order Number: ${task.orderNumber || "None"}
- Current Stages: ${JSON.stringify(task.stages)}

New Email:
Subject: ${subject}
From: ${sender} (${senderEmail})
Body: ${body}

Determine if this email indicates progress on the task:
1. Quote/estimate received
2. Order confirmed/placed
3. Invoice received
4. Payment made
5. Delivery completed
6. Task completion

Look for keywords like: "quote", "estimate", "order confirmed", "invoice", "payment", "delivered", "completed", "finished"

Respond with JSON:
{
  "hasUpdate": boolean,
  "confidence": number,
  "status": "pending|in_progress|completed|cancelled",
  "stages": [updated stages array],
  "orderNumber": "string if found",
  "invoiceNumber": "string if found", 
  "amount": number,
  "completedAt": "ISO date if completed",
  "reasoning": "explanation"
}
`;

      const response = await openaiService.generateStructuredResponse(prompt, "task_update", {
        type: "json_schema",
        zodSchema: TaskUpdateSchema,
        name: "task_update"
      });

      if (!response.hasUpdate) return null;

      return {
        status: response.status,
        stages: response.stages.map(s => ({ ...s, completedAt: s.completedAt ? new Date(s.completedAt) : undefined })),
        orderNumber: response.orderNumber,
        invoiceNumber: response.invoiceNumber,
        amount: response.amount,
        completedAt: response.completedAt ? new Date(response.completedAt) : undefined
      };
    } catch (error) {
      console.error("Error updating task from email:", error);
      return null;
    }
  }

  async processEmailForTasks(emailId: number, emailContent: any, userId: string): Promise<void> {
    try {
      // Check if this email creates a new task
      const taskDetection = await this.detectTaskFromEmail(emailId, emailContent, userId);

      if (taskDetection.isTask && taskDetection.confidence > 0.7) {
        // Create new task
        await storage.createTask({
          userId,
          title: taskDetection.title!,
          description: taskDetection.description,
          category: taskDetection.category,
          priority: taskDetection.priority,
          detectedFromEmailId: emailId,
          relatedEmails: [emailId],
          autoDetected: true,
          confidence: taskDetection.confidence,
          supplier: taskDetection.supplier,
          amount: taskDetection.amount,
          orderNumber: taskDetection.orderNumber,
          stages: taskDetection.stages
        });

        console.log(`Created new task: ${taskDetection.title} (confidence: ${taskDetection.confidence})`);
      }

      // Check if this email updates existing tasks
      const existingTasks = await storage.getUserTasks(userId, ["pending", "in_progress"]);

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
}

export const taskService = new TaskService();
