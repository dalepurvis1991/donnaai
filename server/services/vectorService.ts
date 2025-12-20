import { openaiService } from "./openaiService";
import { storage } from "../storage";
import fs from "fs/promises";
import path from "path";

export interface VectorDocument {
  id: string;
  text: string;
  metadata: {
    type: "email" | "note" | "conversation";
    userId: string;
    emailId?: number;
    subject?: string;
    sender?: string;
    category?: string;
    createdAt: Date;
  };
  embedding?: number[];
}

export interface MemorySearchResult {
  document: VectorDocument;
  score: number;
}

const STORAGE_PATH = path.join(process.cwd(), "data", "vector_store.json");

export class VectorService {
  private memoryStore: Map<string, VectorDocument> = new Map();

  constructor() {
    this.loadFromFile();
  }

  private async loadFromFile() {
    try {
      await fs.mkdir(path.dirname(STORAGE_PATH), { recursive: true });
      const data = await fs.readFile(STORAGE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      this.memoryStore = new Map(Object.entries(parsed));
      console.log(`Loaded ${this.memoryStore.size} memories from storage.`);
    } catch (error) {
      console.log("No existing vector store found, starting fresh.");
    }
  }

  private async saveToFile() {
    try {
      const data = JSON.stringify(Object.fromEntries(this.memoryStore));
      await fs.writeFile(STORAGE_PATH, data);
    } catch (error) {
      console.error("Error saving vector store:", error);
    }
  }

  async indexEmail(emailId: number, userId: string): Promise<void> {
    try {
      const email = await storage.getEmailById(emailId);
      if (!email) return;

      const document: VectorDocument = {
        id: `email-${emailId}`,
        text: `${email.subject}\n\n${email.body}`,
        metadata: {
          type: "email",
          userId,
          emailId,
          subject: email.subject,
          sender: email.sender,
          category: email.category,
          createdAt: new Date(email.date),
        },
      };

      const embedding = await openaiService.generateEmbedding(document.text);
      document.embedding = embedding;

      this.memoryStore.set(document.id, document);
      await this.saveToFile();
    } catch (error) {
      console.error(`Error indexing email ${emailId}:`, error);
    }
  }

  async indexNote(noteId: string, content: string, userId: string): Promise<void> {
    try {
      const document: VectorDocument = {
        id: `note-${noteId}`,
        text: content,
        metadata: {
          type: "note",
          userId,
          createdAt: new Date(),
        },
      };

      const embedding = await openaiService.generateEmbedding(document.text);
      document.embedding = embedding;

      this.memoryStore.set(document.id, document);
      await this.saveToFile();
    } catch (error) {
      console.error(`Error indexing note ${noteId}:`, error);
    }
  }

  async indexConversation(conversationId: string, messages: any[], userId: string): Promise<void> {
    try {
      const conversationText = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const document: VectorDocument = {
        id: `conversation-${conversationId}`,
        text: conversationText,
        metadata: {
          type: "conversation",
          userId,
          createdAt: new Date(),
        },
      };

      const embedding = await openaiService.generateEmbedding(document.text);
      document.embedding = embedding;

      this.memoryStore.set(document.id, document);
      await this.saveToFile();
    } catch (error) {
      console.error(`Error indexing conversation ${conversationId}:`, error);
    }
  }

  async searchMemories(query: string, userId: string, limit: number = 5): Promise<MemorySearchResult[]> {
    try {
      const queryEmbedding = await openaiService.generateEmbedding(query);

      const userDocuments = Array.from(this.memoryStore.values())
        .filter(doc => doc.metadata.userId === userId);

      const results: MemorySearchResult[] = [];

      for (const doc of userDocuments) {
        if (doc.embedding) {
          const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
          results.push({ document: doc, score });
        }
      }

      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error("Error searching memories:", error);
      return [];
    }
  }

  async getUserMemories(userId: string): Promise<VectorDocument[]> {
    return Array.from(this.memoryStore.values())
      .filter(doc => doc.metadata.userId === userId)
      .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
  }

  async deleteMemory(documentId: string): Promise<void> {
    this.memoryStore.delete(documentId);
    await this.saveToFile();
  }

  async indexAllUserEmails(userId: string): Promise<void> {
    try {
      const emails = await storage.getEmails();

      for (const email of emails) {
        await this.indexEmail(email.id, userId);
      }
    } catch (error) {
      console.error("Error indexing all user emails:", error);
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const vectorService = new VectorService();
