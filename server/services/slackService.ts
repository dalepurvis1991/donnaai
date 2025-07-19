import { WebClient } from '@slack/web-api';

export class SlackService {
  private client: WebClient;

  constructor(token: string) {
    this.client = new WebClient(token);
  }

  async syncMessages(channel: string): Promise<any[]> {
    const result = await this.client.conversations.history({ channel });
    return result.messages;
  }
} 