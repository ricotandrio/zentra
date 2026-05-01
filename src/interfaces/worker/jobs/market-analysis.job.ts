import { Logger } from 'pino';
import { AnalyzeMarketUseCase, GetSubscribedTickersUseCase } from '@/application/use-cases/ticker';
import { ITickerRepository } from '@/domain/repositories/ticker.repository';
import { WorkerWebhookPayload, MarketAnalysisResultDTO } from '@/application/dto/market-results.dto';

interface MarketAnalysisJobConfig {
  channelId: string;
  webhookUrl: string;
  logger: Logger;
  tickerRepository: ITickerRepository;
}

/**
 * Market Analysis Job
 * Analyzes market data for all subscribed tickers and sends results to API webhook
 */
export class MarketAnalysisJob {
  constructor(private config: MarketAnalysisJobConfig) {}

  async execute(): Promise<void> {
    const { logger, tickerRepository, channelId, webhookUrl } = this.config;

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

      // Convert to webhook payload format
      const results: MarketAnalysisResultDTO[] = analyses.map((analysis) => ({
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

      // Build webhook payload
      const payload: WorkerWebhookPayload = {
        source: 'market-analysis-job',
        timestamp: new Date().toISOString(),
        results,
        channelId,
      };

      // Send to API webhook
      logger.info(
        { url: webhookUrl, resultsCount: results.length },
        'Sending results to webhook'
      );

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Webhook returned ${response.status}: ${errorText}`
        );
      }

      const responseData = await response.json();
      logger.info(responseData, 'Webhook response received');

      logger.info({ count: analyses.length }, 'Market analysis completed');
    } catch (error) {
      logger.error(error, 'Error executing market analysis job');
      throw error;
    }
  }
}

