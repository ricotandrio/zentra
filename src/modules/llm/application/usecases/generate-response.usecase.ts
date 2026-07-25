import { IGeminiPort } from '@/modules/llm/application/contracts/llm.port';

const FALLBACK_MESSAGE = "Sorry, I couldn't generate a response right now.";

export class GenerateResponseUseCase {
  constructor(private geminiPort: IGeminiPort) {}

  async execute(prompt: string): Promise<string> {
    const trimmed = prompt.trim();

    if (!trimmed) {
      return 'Please provide a message for me to respond to.';
    }

    try {
      return await this.geminiPort.generate(trimmed);
    } catch {
      return FALLBACK_MESSAGE;
    }
  }
}
