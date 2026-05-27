import { IEventBus, MarketAnalysisCompleteEvent, MarketAnalysisErrorEvent, WorkerMarketAnalysisTriggerEvent } from '@/shared/event-bus';
import { MarketAnalysisJob } from './job';
import { TickerManagementModule } from '@/modules/ticker-management';
import { logger } from '@/shared/logger';

/**
 * Market Analysis Event Subscriber
 * Subscribes to market analysis events from the worker and handles them
 * (logging, monitoring, etc.)
 */
export class MarketAnalysisSubscriber {
  constructor(
    private eventBus: IEventBus, 
    private channelId: string,
    private tickerManagementModule: TickerManagementModule
  ) {}

  /**
   * Subscribe to market analysis events
   * Returns unsubscribe functions to allow cleanup
   */
  subscribe(): { unsubscribeComplete: () => void; unsubscribeError: () => void; unsubscribeTrigger: () => void } {
    const unsubscribeTrigger = this.eventBus.subscribe(
      'worker:market-analysis:trigger',
      this.handleTrigger.bind(this)
    );

    const unsubscribeComplete = this.eventBus.subscribe(
      'market-analysis:complete',
      this.handleComplete.bind(this)
    );

    const unsubscribeError = this.eventBus.subscribe(
      'market-analysis:error',
      this.handleError.bind(this)
    );

    logger.info({
      source: 'system',
      operation: 'market-analysis-subscriber-init',
    }, 'Market analysis subscriber initialized');

    return { unsubscribeComplete, unsubscribeError, unsubscribeTrigger };
  }

  /**
   * Handle market analysis trigger events
   */
  private async handleTrigger(event: WorkerMarketAnalysisTriggerEvent): Promise<void> {
    const traceId = event.timestamp.toISOString();
    const job = new MarketAnalysisJob({
      eventBus: this.eventBus,
      channelId: this.channelId,
      tickerManagementModule: this.tickerManagementModule,
    });
    await job.execute();

    logger.info({
      source: 'worker',
      operation: 'market-analysis-trigger',
      traceId,
      eventId: event.timestamp.toISOString(),
      metadata: { timestamp: event.timestamp },
    }, 'Received market analysis trigger event - worker should start analysis');
  }

  /**
   * Handle market analysis completion
   */
  private async handleComplete(event: MarketAnalysisCompleteEvent): Promise<void> {
    const { data } = event;
    const traceId = event.timestamp.toISOString();
    logger.info({
      source: 'worker',
      operation: 'market-analysis-complete',
      traceId,
      eventId: event.timestamp.toISOString(),
      metadata: {
        resultsCount: data.results.length,
        channelId: data.channelId,
        timestamp: data.timestamp,
      },
    }, 'Market analysis completed - results ready for delivery');

    // Log sentiment summary
    const sentiments = data.results.reduce(
      (acc, result) => {
        const sentiment = result.sentiment.toLowerCase();
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    logger.debug({
      source: 'worker',
      operation: 'market-analysis-complete',
      traceId,
      metadata: { sentiments },
    }, 'Sentiment distribution');
  }

  /**
   * Handle market analysis errors
   */
  private async handleError(event: MarketAnalysisErrorEvent): Promise<void> {
    const { data } = event;
    const traceId = event.timestamp.toISOString();
    logger.error({
      source: 'worker',
      operation: 'market-analysis-error',
      traceId,
      eventId: event.timestamp.toISOString(),
      error: data.error,
      metadata: { timestamp: data.timestamp },
    }, 'Market analysis job failed');
  }
}
