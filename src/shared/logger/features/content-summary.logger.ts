import { Logger } from 'pino';

export const createContentSummaryLogger = (logger: Logger) => {
  return {
    moduleInit: () => {
      logger.info(
        { source: 'system', operation: 'content-summary-module-init' },
        'Content summary module initialized'
      );
    },

    summarizeStarted: (params: { url: string }) => {
      logger.info(
        { source: 'system', operation: 'summarize-content', metadata: { url: params.url } },
        'Summarize content request started'
      );
    },

    scraping: (params: { url: string }) => {
      logger.info(
        { source: 'system', operation: 'content-scraper-fetch', metadata: { url: params.url } },
        'Fetching page content'
      );
    },

    scraped: (params: { url: string; markdownLength: number }) => {
      logger.info(
        { source: 'system', operation: 'content-scraper-fetch', metadata: { url: params.url, markdownLength: params.markdownLength } },
        'Page content converted to markdown'
      );
    },

    scrapeFailed: (params: { url: string; error: unknown }) => {
      logger.error(
        { source: 'system', operation: 'content-scraper-fetch', metadata: { url: params.url }, error: params.error },
        'Failed to scrape page content'
      );
    },

    summaryGenerated: (params: { url: string; summaryLength: number }) => {
      logger.info(
        { source: 'system', operation: 'summarize-content', metadata: { url: params.url, summaryLength: params.summaryLength } },
        'Content summary generated'
      );
    },
  };
};
