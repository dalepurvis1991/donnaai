import { ElevenLabs } from 'elevenlabs';

export class VoiceService {
  private client: ElevenLabs;

  constructor() {
    this.client = new ElevenLabs({ apiKey: process.env.ELEVENLABS_API_KEY });
  }

  async generateSpeech(text: string): Promise<Buffer> {
    const audio = await this.client.textToSpeech.convert({ text });
    return audio;
  }
}

export const voiceService = new VoiceService(); 