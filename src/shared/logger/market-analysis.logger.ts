import { Logger } from 'pino';

export const createMarketAnalysisLogger = (logger: Logger) => {
  return {
    jobStarted: (params: { traceId: string }) => {
      logger.info(
        { source: 'worker', operation: 'market-analysis-job', traceId: params.traceId },
        'Starting market analysis job'
      );
    },

    noTickers: (params: { traceId: string }) => {
      logger.info(
        { source: 'worker', operation: 'market-analysis-job', traceId: params.traceId },
        'No tickers to analyze'
      );
    },

    jobFailed: (params: { traceId: string; error: unknown }) => {
      logger.error(
        { source: 'worker', operation: 'market-analysis-job', error: params.error, traceId: params.traceId },
        'Error executing market analysis job'
      );
    },

    tickersAnalyzed: (params: { tickerCount: number }) => {
      logger.info(
        { source: 'worker', operation: 'analyze-tickers', metadata: { tickerCount: params.tickerCount } },
        `Analyzing ${params.tickerCount} tickers`
      );
    },

    analysisPublished: (params: { traceId: string; resultsCount: number }) => {
      logger.info(
        { source: 'worker', operation: 'publish-market-analysis-complete', traceId: params.traceId, metadata: { resultsCount: params.resultsCount } },
        `Publishing market analysis complete event with ${params.resultsCount} results`
      );
    },

    analysisCompleted: (params: { analysisCount: number }) => {
      logger.info(
        { source: 'worker', operation: 'market-analysis-complete', metadata: { analysisCount: params.analysisCount } },
        `Market analysis completed with ${params.analysisCount} results`
      );
    },

    summaryFetching: () => {
      logger.info(
        { source: 'worker', operation: 'fetch-market-summary' },
        'Fetching market summary from market data source'
      );
    },

    summaryFetchFailed: (params: { error: unknown }) => {
      logger.warn(
        { source: 'worker', operation: 'fetch-market-summary', error: params.error },
        'Failed to fetch market summary, continuing without it'
      );
    },

    summaryPublished: (params: { traceId: string; totalTickers: number }) => {
      logger.info(
        { source: 'worker', operation: 'publish-market-summary', traceId: params.traceId, metadata: { totalTickers: params.totalTickers } },
        `Publishing market summary event with ${params.totalTickers} tickers`
      );
    },

    subscriberInit: () => {
      logger.info(
        { source: 'system', operation: 'market-analysis-subscriber-init' },
        'Market analysis subscriber initialized'
      );
    },

    triggerReceived: (params: { traceId?: string }) => {
      logger.info(
        { source: 'worker', operation: 'market-analysis-trigger', traceId: params.traceId },
        'Received market analysis trigger event - worker should start analysis'
      );
    },

    resultsReceived: (params: { traceId?: string; resultsCount: number; channelId: string }) => {
      logger.info(
        { source: 'worker', operation: 'market-analysis-complete', traceId: params.traceId, metadata: { resultsCount: params.resultsCount, channelId: params.channelId } },
        'Market analysis completed - results ready for delivery'
      );
    },

    sentimentDistribution: (params: { traceId?: string; sentiments: Record<string, number> }) => {
      logger.debug(
        { source: 'worker', operation: 'market-analysis-complete', traceId: params.traceId, metadata: { sentiments: params.sentiments } },
        'Sentiment distribution'
      );
    },

    errorReceived: (params: { traceId?: string; error: unknown }) => {
      logger.error(
        { source: 'worker', operation: 'market-analysis-error', traceId: params.traceId, error: params.error },
        'Market analysis job failed'
      );
    },
  };
};
