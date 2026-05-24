import { IEventBus, MarketAnalysisCompleteEvent, MarketAnalysisErrorEvent, MarketSummaryCompleteEvent } from '@/shared/event-bus';
import { TickerManagementModule } from '@/modules/ticker-management';
import { AnalyzeTickersUseCase } from './application/usecases/analyze-tickers.usecase';
import { MarketSummaryUseCase } from './application/usecases/market-summary.usecase';
import { SchedulerJob } from '@/shared/scheduler/scheduler.types';
import { convertCronScheduleHour, Utc } from '@/shared/utils';
import { logger } from '@/shared/logger';

interface MarketAnalysisJobConfig {
  channelId: string;
  eventBus: IEventBus;
  tickerManagementModule: TickerManagementModule;
}

export class MarketAnalysisJob implements SchedulerJob {
  name = 'MarketAnalysisJob';
  schedule = convertCronScheduleHour('0 18 * * *', Utc.UTC7, Utc.UTC0); // 6 PM UTC+7

  constructor(private config: MarketAnalysisJobConfig) {}

  async execute(): Promise<void> {
    const { tickerManagementModule } = this.config;

    try {
      logger.info('Starting market analysis job');

      const tickers = await tickerManagementModule.getTickersUseCase.execute();

      if (!tickers || tickers.length === 0) {
        logger.info('No tickers to analyze');
        return;
      }

      // Analyze tickers and publish event
      await this.analyzeTickersAndPublish(tickers);

      // Fetch market summary and publish event
      await this.publishMarketSummary();
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

  /**
   * Analyze tickers and publish market analysis complete event
   */
  private async analyzeTickersAndPublish(tickers: any[]): Promise<void> {
    const { channelId, eventBus } = this.config;

    const analyzeUseCase = new AnalyzeTickersUseCase();
    const tickerSymbols = tickers.map((t) => t.symbol);

    logger.info(`Analyzing ${tickerSymbols.length} tickers`);

    const analyses = await analyzeUseCase.execute(tickerSymbols);

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

    // Convert SentimentResult to string format for DTO
    const formattedResults = results.map((r) => ({
      ...r,
      sentiment: `${r.sentiment.label}:${r.sentiment.score}`,
    }));

    // Build and publish event
    const event: MarketAnalysisCompleteEvent = {
      type: 'market-analysis:complete',
      source: 'worker',
      timestamp: new Date(),
      data: {
        channelId,
        timestamp: new Date().toISOString(),
        results: formattedResults,
      },
    };

    logger.info(`Publishing market analysis complete event with ${results.length} results`);

    await eventBus.publish(event);

    logger.info(`Market analysis completed with ${analyses.length} results`);
  }

  /**
   * Fetch market summary and publish market summary event
   */
  private async publishMarketSummary(): Promise<void> {
    const { channelId, eventBus } = this.config;

    try {
      logger.info('Fetching market summary from market data source');
      const marketSummaryUseCase = new MarketSummaryUseCase();
      const marketSummary = await marketSummaryUseCase.execute();

      // Publish market summary event
      const marketSummaryEvent: MarketSummaryCompleteEvent = {
        type: 'market-summary:complete',
        source: 'worker',
        timestamp: new Date(),
        data: {
          channelId,
          timestamp: new Date().toISOString(),
          summary: marketSummary,
        },
      };

      logger.info(`Publishing market summary event with ${marketSummary.totalTickers} tickers`);
      await eventBus.publish(marketSummaryEvent);
    } catch (error) {
      logger.warn(error, 'Failed to fetch market summary, continuing without it');
      // Don't throw, allow the job to complete even if market summary fails
    }
  }
}
