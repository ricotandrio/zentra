import { GoogleGenAI } from '@google/genai';
import { IGeminiPort } from '@/modules/llm/application/contracts/llm.port';

export class GeminiAdapter implements IGeminiPort {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    return response.text ?? '';
  }
}
