import { chromium, Browser, Page } from 'playwright';
import TurndownService from 'turndown';
import { IScraperPort } from '@/modules/content-summary/application/contracts/scraper.port';
import { logging } from '@/shared/logger';

export class WebScraperAdapter implements IScraperPort {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
    });
  }

  private async ensureBrowser(): Promise<void> {
    if (this.browser) return;

    try {
      logging.infra.scraperInitialized();
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
      this.page = await this.browser.newPage();
    } catch (error) {
      logging.infra.scraperInitFailed({ error });
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      logging.infra.scraperClosed();
    }
  }

  async extractMarkdown(url: string): Promise<string> {
    await this.ensureBrowser();

    if (!this.page) {
      throw new Error('Adapter not initialized.');
    }

    try {
      logging.contentSummary.scraping({ url });

      const response = await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      if (!response?.ok()) {
        throw new Error(`Failed to fetch URL (HTTP ${response?.status() ?? 'unknown'})`);
      }

      await this.page
        .waitForLoadState('networkidle', { timeout: 10000 })
        .catch(() => undefined);

      const html = await this.page.content();
      const markdown = this.turndownService
        .turndown(html)
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (!markdown) {
        throw new Error('No readable content found on the page.');
      }

      logging.contentSummary.scraped({ url, markdownLength: markdown.length });
      return markdown;
    } catch (error) {
      logging.contentSummary.scrapeFailed({ url, error });
      // eslint-disable-next-line preserve-caught-error
      throw new Error(
        `Content scraper error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
