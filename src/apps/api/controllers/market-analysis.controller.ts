import { Request, Response } from 'express';
import { logging } from '@/shared/logger';
import { IEventBus, WorkerMarketAnalysisTriggerEvent } from '@/shared/event-bus';
import { generateTraceId } from '@/shared/utils';

export const triggerWorker = (
  eventBus?: IEventBus
) => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      logging.api.triggerWorker({
        traceId: '',
        request: { method: req.method, path: req.path },
      });

      if (!eventBus) {
        logging.api.triggerWorkerEventBusUnavailable();
        res.status(503).json({
          error: 'Event bus not initialized',
        });
        return;
      }

      // Publish worker trigger event with traceId generated at entry point
      const traceId = generateTraceId();
      const event: WorkerMarketAnalysisTriggerEvent = {
        type: 'worker:market-analysis:trigger',
        source: 'api',
        timestamp: new Date(),
        traceId,
      };

      await eventBus.publish(event);

      logging.api.triggerWorkerEventPublished({ traceId });
      res.status(200).json({
        success: true,
        message: 'Market analysis worker triggered',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logging.api.triggerWorkerFailed({ error });
      res.status(500).json({
        error: message,
      });
    }
  };
};
