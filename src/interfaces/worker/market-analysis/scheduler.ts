import cron from 'node-cron';
import { Logger } from 'pino';
import { MarketAnalysisJob } from './job';
import { ITickerRepository } from '@/domain/repositories/ticker.repository';
import { IEventBus } from '@/shared/event-bus';

/** 
 * Scheduler configuration interface 
 */
interface SchedulerConfig {
  /** Logger instance for logging scheduler activity */
  logger: Logger;

  /** Ticker repository for accessing subscribed tickers */
  tickerRepository: ITickerRepository;

  /** Discord channel ID where market analysis results will be posted */
  channelId: string;

  /** Event bus for publishing market analysis results */
  eventBus: IEventBus;

  /** Optional cron schedule string (default: '0 18 * * *' for daily at 6 PM UTC+0) */
  schedule?: string;
}

/**
 * Market Analysis Scheduler
 * Runs market analysis job on a schedule and publishes results via event bus
 */
export class MarketAnalysisScheduler {
  private task: cron.ScheduledTask | null = null;
  private config: SchedulerConfig;

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  start(): void {
    const { logger, schedule = '0 18 * * *' } = this.config;

    logger.info({ schedule }, 'Starting market analysis scheduler');

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
