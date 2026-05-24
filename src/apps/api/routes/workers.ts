import { Router } from 'express';
import { IEventBus } from '@/shared/event-bus';
import { triggerWorker as triggerMarketAnalysisWorker } from '../controllers/market-analysis.controller';

export const createWorkerRoutes = (
  eventBus?: IEventBus
): Router => {
  const router = Router();

  router.get('/market-analysis', triggerMarketAnalysisWorker(eventBus));

  return router;
};
