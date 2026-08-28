import { GoogleGenAI } from '@google/genai';
import { IGeminiPort } from '@/modules/llm/application/contracts/llm.port';
import { logging } from '@/shared/logger';

export class GeminiAdapter implements IGeminiPort {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text ?? '';

      logging.llm.responseGenerated({
        promptLength: prompt.length,
        responseLength: text.length,
      });

      return text;
    } catch (error) {
      logging.llm.responseFailed({ error });
      throw error;
    }
  }
}
