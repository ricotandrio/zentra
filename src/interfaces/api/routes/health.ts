import { Router } from 'express';
import { Logger } from 'pino';
import { pingController } from '../controllers/health.controller';

export const createHealthRoutes = (
  logger: Logger
): Router => {
  const router = Router();

  router.post('/ping', pingController(logger));

  return router;
};
