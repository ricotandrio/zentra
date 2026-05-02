import { Logger } from 'pino';
import { AnalyzeMarketUseCase, GetSubscribedTickersUseCase } from '@/application/use-cases/ticker';
import { ITickerRepository } from '@/domain/repositories/ticker.repository';
import { IEventBus, MarketAnalysisCompleteEvent, MarketAnalysisErrorEvent } from '@/shared/event-bus';

interface MarketAnalysisJobConfig {
  channelId: string;
  logger: Logger;
  tickerRepository: ITickerRepository;
  eventBus: IEventBus;
}

/**
 * Market Analysis Job
 * Analyzes market data for all subscribed tickers and publishes results via event bus
 */
export class MarketAnalysisJob {
  constructor(private config: MarketAnalysisJobConfig) {}

  async execute(): Promise<void> {
    const { logger, tickerRepository, channelId, eventBus } = this.config;

    try {
      logger.info('Starting market analysis job');

      // Get subscribed tickers
      const getTickersUseCase = new GetSubscribedTickersUseCase(tickerRepository);
      const tickers = await getTickersUseCase.execute();

      if (tickers.length === 0) {
        logger.info('No tickers to analyze');
        return;
      }

      // Analyze market data
      const analyzeUseCase = new AnalyzeMarketUseCase();
      const tickerSymbols = tickers.map((t) => t.symbol);

      logger.info({ count: tickerSymbols.length }, 'Analyzing tickers');
      const analyses = await analyzeUseCase.analyzeMultipleTickers(tickerSymbols);

      // Convert to event payload format
      const results = analyses.map((analysis) => ({
        ticker: analysis.quote.ticker,
        price: analysis.quote.price,
        changePercent: analysis.quote.changePercent,
        sentiment: analysis.overallSentiment,
        volume: analysis.quote.volume,
        fiftyTwoWeekHigh: analysis.quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: analysis.quote.fiftyTwoWeekLow,
        newsCount: analysis.news.length,
        topHeadlines: analysis.news.slice(0, 3).map((n) => n.title),
      }));

      // Build and publish event
      const event: MarketAnalysisCompleteEvent = {
        type: 'market-analysis:complete',
        source: 'worker',
        timestamp: new Date(),
        data: {
          channelId,
          timestamp: new Date().toISOString(),
          results,
        },
      };

      logger.info(
        { resultsCount: results.length },
        'Publishing market analysis complete event'
      );

      await eventBus.publish(event);

      logger.info({ count: analyses.length }, 'Market analysis completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error(error, 'Error executing market analysis job');

      // Publish error event
      const errorEvent: MarketAnalysisErrorEvent = {
        type: 'market-analysis:error',
        source: 'worker',
        timestamp: new Date(),
        data: {
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
      };

      await this.config.eventBus.publish(errorEvent);
      throw error;
    }
  }
}

