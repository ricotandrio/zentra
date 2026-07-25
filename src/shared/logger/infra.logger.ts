import { Logger } from 'pino';

export const createInfraLogger = (logger: Logger) => {
  return {
    scraperInitialized: () => {
      logger.info(
        { source: 'system', operation: 'market-scraper-init' },
        'Initializing market scraper adapter'
      );
    },

    scraperInitFailed: (params: { error: unknown }) => {
      logger.error(
        { source: 'system', operation: 'market-scraper-init', error: params.error },
        'Failed to initialize browser'
      );
    },

    scraperClosed: () => {
      logger.info(
        { source: 'system', operation: 'market-scraper-close' },
        'Market scraper adapter closed'
      );
    },

    rawDataFetching: () => {
      logger.info(
        { source: 'system', operation: 'market-scraper-fetch' },
        'Fetching raw trading summary from market data source'
      );
    },

    invalidResponse: () => {
      logger.error(
        { source: 'system', operation: 'market-scraper-fetch' },
        'Invalid market response format'
      );
    },

    rawDataFetched: (params: { tickerCount: number }) => {
      logger.info(
        { source: 'system', operation: 'market-scraper-fetch', metadata: { tickerCount: params.tickerCount } },
        `Retrieved ${params.tickerCount} tickers from market data source`
      );
    },

    rawDataFailed: (params: { error: unknown }) => {
      logger.error(
        { source: 'system', operation: 'market-scraper-fetch', error: params.error },
        'Failed to fetch market data'
      );
    },
  };
};
