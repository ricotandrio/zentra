import cron from 'node-cron';
import { Logger } from 'pino';
import { MarketAnalysisJob } from './job';
import { IEventBus } from '@/shared/event-bus';
import { TickerManagementModule } from '@/modules/ticker-management';

/** 
 * Scheduler configuration interface 
 */
interface SchedulerConfig {
  /** Logger instance for logging scheduler activity */
  logger: Logger;

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
    const { logger, schedule = '0 18 * * *' } = this.config;

    logger.info(`Starting market analysis scheduler at ${schedule}`);

    this.task = cron.schedule(schedule, async () => {
      try {
        const job = new MarketAnalysisJob(this.config);
        await job.execute();
      } catch (error) {
        this.config.logger.error(error, 'Scheduled market analysis job failed');
      }
    });
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.config.logger.info('Market analysis scheduler stopped');
    }
  }
}
