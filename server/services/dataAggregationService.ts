import { storage } from "../storage";
import { taskService } from "./taskService";

export class DataAggregationService {
  async syncDataSources(userId: string): Promise<void> {
    const sources = await storage.getDataSources(userId);
    for (const source of sources) {
      await this.syncSource(source);
      const messages = await storage.getRecentMessages(source.id);
      for (const msg of messages) {
        await taskService.processMessageForTasks(msg.id, msg, userId);
      }
    }
  }

  private async syncSource(source: any): Promise<void> {
    // Implement sync logic for each source type
    if (source.sourceType === 'whatsapp') {
      // WhatsApp sync logic
    } else if (source.sourceType === 'slack') {
      // Slack sync logic
    } // Add more
  }
}

export const dataAggregationService = new DataAggregationService(); 