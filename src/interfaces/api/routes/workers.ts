import { Router } from 'express';
import { Logger } from 'pino';
import { IEventBus } from '@/shared/event-bus';
import { triggerWorker as triggerMarketAnalysisWorker } from '../controllers/market-analysis.controller';

export const createWorkerRoutes = (
  logger: Logger,
  eventBus?: IEventBus
): Router => {
  const router = Router();

  router.get('/market-analysis', triggerMarketAnalysisWorker(logger, eventBus));

  return router;
};
