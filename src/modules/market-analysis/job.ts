import { IEventBus, MarketAnalysisCompleteEvent, MarketAnalysisErrorEvent, MarketSummaryCompleteEvent } from '@/shared/event-bus';
import { AnalyzeTickersUseCase } from './application/usecases/analyze-tickers.usecase';
import { MarketSummaryUseCase } from './application/usecases/market-summary.usecase';
import { TickerReaderPort } from './application/contracts';
import { SchedulerJob } from '@/shared/scheduler/scheduler.types';
import { convertCronScheduleHour, Utc } from '@/shared/utils';
import { logging } from '@/shared/logger';

export interface MarketAnalysisJobDependencies {
  channelId: string;
  eventBus: IEventBus;
  tickerReader: TickerReaderPort;
  analyzeTickersUseCase: AnalyzeTickersUseCase;
  marketSummaryUseCase: MarketSummaryUseCase;
}

interface MarketAnalysisJobConfig extends MarketAnalysisJobDependencies {
  traceId?: string;
}

export class MarketAnalysisJob implements SchedulerJob {
  name = 'MarketAnalysisJob';
  schedule = convertCronScheduleHour('0 18 * * *', Utc.UTC7, Utc.UTC0); // 6 PM UTC+7

  constructor(private config: MarketAnalysisJobConfig) {}

  async execute(): Promise<void> {
    const { traceId, tickerReader } = this.config;

    const traceIdForThisRun = traceId || `market-analysis-${Date.now()}`;

    try {
      logging.marketAnalysis.jobStarted({ traceId: traceIdForThisRun });

      const tickers = await tickerReader.getTickers();

      if (!tickers || tickers.length === 0) {
        logging.marketAnalysis.noTickers({ traceId: traceIdForThisRun });
        return;
      }

      // Analyze tickers and publish event
      await this.analyzeTickersAndPublish(tickers, traceIdForThisRun);

      // Fetch market summary and publish event
      await this.publishMarketSummary(traceIdForThisRun);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logging.marketAnalysis.jobFailed({ traceId: traceIdForThisRun, error });

      // Publish error event with same traceId
      const errorEvent: MarketAnalysisErrorEvent = {
        type: 'market-analysis:error',
        source: 'worker',
        timestamp: new Date(),
        traceId: traceIdForThisRun,
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
  private async analyzeTickersAndPublish(tickers: any[], traceId: string): Promise<void> {
    const { channelId, eventBus, analyzeTickersUseCase } = this.config;

    const tickerSymbols = tickers.map((t) => t.symbol);

    logging.marketAnalysis.tickersAnalyzed({ tickerCount: tickerSymbols.length });

    const analyses = await analyzeTickersUseCase.execute(tickerSymbols);

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
      traceId,
      data: {
        channelId,
        timestamp: new Date().toISOString(),
        results: formattedResults,
      },
    };

    logging.marketAnalysis.analysisPublished({ traceId, resultsCount: results.length });

    await eventBus.publish(event);

    logging.marketAnalysis.analysisCompleted({ analysisCount: analyses.length });
  }

  /**
   * Fetch market summary and publish market summary event
   */
  private async publishMarketSummary(traceId: string): Promise<void> {
    const { channelId, eventBus, marketSummaryUseCase } = this.config;

    try {
      logging.marketAnalysis.summaryFetching();
      const marketSummary = await marketSummaryUseCase.execute();

      // Publish market summary event

      const marketSummaryEvent: MarketSummaryCompleteEvent = {
        type: 'market-summary:complete',
        source: 'worker',
        timestamp: new Date(),
        traceId,
        data: {
          channelId,
          timestamp: new Date().toISOString(),
          summary: marketSummary,
        },
      };

      logging.marketAnalysis.summaryPublished({ traceId, totalTickers: marketSummary.totalTickers });
      await eventBus.publish(marketSummaryEvent);
    } catch (error) {
      logging.marketAnalysis.summaryFetchFailed({ error });
      // Don't throw, allow the job to complete even if market summary fails
    }
  }
}
