import { Llm } from '@/modules/llm/application/ports/llm.port';

const FALLBACK_MESSAGE = "Sorry, I couldn't generate a response right now.";

export class GenerateResponseUseCase {
  constructor(private readonly llm: Llm) {}

  async execute(prompt: string): Promise<string> {
    const trimmed = prompt.trim();

    if (!trimmed) {
      return 'Please provide a message for me to respond to.';
    }

    try {
      return await this.llm.generate(trimmed);
    } catch {
      return FALLBACK_MESSAGE;
    }
  }
}
