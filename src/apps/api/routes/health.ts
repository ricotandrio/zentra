import { Router } from 'express';
import { pingController } from '../controllers/health.controller';

export const createHealthRoutes = (): Router => {
  const router = Router();

  router.get('/ping', pingController());

  return router;
};
