import { IScraperPort } from '@/modules/content-summary/application/contracts/scraper.port';
import { GenerateResponseUseCase } from '@/modules/llm/application/usecases/generate-response.usecase';
import { logging } from '@/shared/logger';

export interface SummarizeContentResult {
  markdown: string;
  summary: string;
}

const URL_PATTERN = /^https?:\/\/\S+$/i;
const MAX_MARKDOWN_CHARS = 15000;

export class SummarizeContentUseCase {
  constructor(
    private scraperPort: IScraperPort,
    private generateUseCase: GenerateResponseUseCase
  ) {}

  async execute(url: string): Promise<SummarizeContentResult> {
    const trimmedUrl = url.trim();

    if (!URL_PATTERN.test(trimmedUrl)) {
      throw new Error('Invalid URL. Please provide a valid http(s) link.');
    }

    logging.contentSummary.summarizeStarted({ url: trimmedUrl });

    const markdown = await this.scraperPort.extractMarkdown(trimmedUrl);
    const truncatedMarkdown =
      markdown.length > MAX_MARKDOWN_CHARS
        ? `${markdown.substring(0, MAX_MARKDOWN_CHARS)}\n\n[Content truncated]`
        : markdown;

    const prompt = [
      'Ringkaslah artikel berikut dalam Bahasa Indonesia dengan maksimal 10 poin penting.',
      'Setiap poin harus dalam format: 1. Diberitakan bahwa ...',
      'Fokus pada informasi utama dan akhirkan dengan kesimpulan singkat.',
      '',
      '---',
      '',
      truncatedMarkdown,
    ].join('\n');

    const summary = await this.generateUseCase.execute(prompt);

    logging.contentSummary.summaryGenerated({ url: trimmedUrl, summaryLength: summary.length });

    return { markdown: truncatedMarkdown, summary };
  }
}
