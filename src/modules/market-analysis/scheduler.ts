import cron from 'node-cron';
import { MarketAnalysisJob } from './job';
import { IEventBus } from '@/shared/event-bus';
import { TickerManagementModule } from '@/modules/ticker-management';
import { logger } from '@/shared/logger';
import { generateTraceId } from '@/shared/utils';

/** 
 * Scheduler configuration interface 
 */
interface SchedulerConfig {
  /** Discord channel ID where market analysis results will be posted */
  channelId: string;

  /** Event bus for publishing market analysis results */
  eventBus: IEventBus;

  /** Optional cron schedule string (default: '0 18 * * *' for daily at 6 PM UTC+0) */
  schedule?: string;

  /** Ticker management module for handling ticker-related operations */
  tickerManagementModule: TickerManagementModule;
}

export class MarketAnalysisScheduler {
  private task: cron.ScheduledTask | null = null;
  private config: SchedulerConfig;

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  start(): void {
    const { schedule = '0 18 * * *' } = this.config;

    logger.info({
      source: 'system',
      operation: 'market-analysis-scheduler-start',
      metadata: { schedule },
    }, `Starting market analysis scheduler at ${schedule}`);

    this.task = cron.schedule(schedule, async () => {
      try {
        const traceId = generateTraceId();
        const job = new MarketAnalysisJob({ ...this.config, traceId });
        await job.execute();
      } catch (error) {
        logger.error({
          source: 'system',
          operation: 'market-analysis-scheduler-job',
          error,
        }, 'Scheduled market analysis job failed');
      }
    });
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      logger.info({
        source: 'system',
        operation: 'market-analysis-scheduler-stop',
      }, 'Market analysis scheduler stopped');
    }
  }
}
