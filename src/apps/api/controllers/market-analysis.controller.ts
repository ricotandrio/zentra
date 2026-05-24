import { Request, Response } from 'express';
import { Logger } from 'pino';
import { IEventBus, WorkerMarketAnalysisTriggerEvent } from '@/shared';

export const triggerWorker = (
  logger: Logger,
  eventBus?: IEventBus
) => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info({ endpoint: '/workers/market-analysis' }, 'Market analysis worker triggered via API');

      if (!eventBus) {
        logger.warn('Event bus not available, cannot trigger worker');
        res.status(503).json({
          error: 'Event bus not initialized',
        });
        return;
      }

      // Publish worker trigger event
      const event: WorkerMarketAnalysisTriggerEvent = {
        type: 'worker:market-analysis:trigger',
        source: 'api',
        timestamp: new Date(),
      };

      await eventBus.publish(event);

      logger.info('Market analysis worker trigger event published');
      res.status(200).json({
        success: true,
        message: 'Market analysis worker triggered',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(error, 'Error triggering market analysis worker');
      res.status(500).json({
        error: message,
      });
    }
  };
};
