import { Router } from 'express';
import { Logger } from 'pino';
import { triggerWorker as triggerMarketAnalysisWorker } from '../controllers/market-analysis.controller';

export const createWorkerRoutes = (
  logger: Logger
): Router => {
  const router = Router();
  router.get('/market-analysis', triggerMarketAnalysisWorker(logger));

  return router;
};
