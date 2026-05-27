import { Router } from 'express';
import { queryLogsController, getLogsStatsController } from '../controllers/logs.controller';

export const createLogsRoutes = (): Router => {
  const router = Router();

  /**
   * Query logs with LogQL format
   * GET /logs/query?query={source="api"}&limit=100&offset=0&startDate=2024-05-27&endDate=2024-05-28
   */
  router.get('/query', queryLogsController());

  /**
   * Get logs statistics
   * GET /logs/stats?startDate=2024-05-27&endDate=2024-05-28
   */
  router.get('/stats', getLogsStatsController());

  return router;
};
