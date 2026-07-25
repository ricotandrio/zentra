import { IEventBus, MarketAnalysisCompleteEvent, MarketAnalysisErrorEvent, WorkerMarketAnalysisTriggerEvent } from '@/shared/event-bus';
import { MarketAnalysisJob } from './job';
import { TickerManagementModule } from '@/modules/ticker-management';
import { logging } from '@/shared/logger';

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

    logging.marketAnalysis.subscriberInit();

    return { unsubscribeComplete, unsubscribeError, unsubscribeTrigger };
  }

  /**
   * Handle market analysis trigger events
   */
  private async handleTrigger(event: WorkerMarketAnalysisTriggerEvent): Promise<void> {
    const job = new MarketAnalysisJob({
      eventBus: this.eventBus,
      channelId: this.channelId,
      tickerManagementModule: this.tickerManagementModule,
      traceId: event.traceId,
    });
    await job.execute();

    logging.marketAnalysis.triggerReceived({ traceId: event.traceId });
  }

  /**
   * Handle market analysis completion
   */
  private async handleComplete(event: MarketAnalysisCompleteEvent): Promise<void> {
    const { data } = event;
    const traceId = event.traceId;

    logging.marketAnalysis.resultsReceived({
      traceId,
      resultsCount: data.results.length,
      channelId: data.channelId,
    });

    // Log sentiment summary
    const sentiments = data.results.reduce(
      (acc, result) => {
        const sentiment = result.sentiment.toLowerCase();
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    logging.marketAnalysis.sentimentDistribution({ traceId, sentiments });
  }

  /**
   * Handle market analysis errors
   */
  private async handleError(event: MarketAnalysisErrorEvent): Promise<void> {
    const { data } = event;
    const traceId = event.traceId;

    logging.marketAnalysis.errorReceived({ traceId, error: data.error });
  }
}
