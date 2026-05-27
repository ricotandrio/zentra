import { Request, Response } from 'express';
import { logger } from '@/shared/logger';
import { IEventBus, WorkerMarketAnalysisTriggerEvent } from '@/shared/event-bus';
import { generateShortTraceId } from '@/shared/utils';

export const triggerWorker = (
  eventBus?: IEventBus
) => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info({
        source: 'api',
        operation: 'trigger-market-analysis-worker',
        request: { method: req.method, path: req.path },
      }, 'Market analysis worker triggered via API');

      if (!eventBus) {
        logger.warn({
          source: 'api',
          operation: 'trigger-market-analysis-worker',
          error: 'Event bus not available',
        }, 'Event bus not available, cannot trigger worker');
        res.status(503).json({
          error: 'Event bus not initialized',
        });
        return;
      }

      // Publish worker trigger event
      const traceId = generateShortTraceId();
      const event: WorkerMarketAnalysisTriggerEvent = {
        type: 'worker:market-analysis:trigger',
        source: 'api',
        timestamp: new Date(),
        traceId,
      };

      await eventBus.publish(event);

      logger.info({
        source: 'api',
        operation: 'trigger-market-analysis-worker',
        traceId,
        response: { statusCode: 200 },
      }, 'Market analysis worker trigger event published');
      res.status(200).json({
        success: true,
        message: 'Market analysis worker triggered',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({
        source: 'api',
        operation: 'trigger-market-analysis-worker',
        error,
        response: { statusCode: 500 },
      }, 'Error triggering market analysis worker');
      res.status(500).json({
        error: message,
      });
    }
  };
};
