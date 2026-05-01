import { Router } from 'express';
import { Client as DiscordClient } from 'discord.js';
import { Logger } from 'pino';
import { marketResultsController } from '../controllers/market-results.controller';

export const createWebhookRoutes = (
  discordClient: DiscordClient,
  logger: Logger
): Router => {
  const router = Router();

  /**
   * POST /webhooks/market-results
   * Receive market analysis results from worker
   * 
   * Body: WorkerWebhookPayload
   * {
   *   source: "market-analysis-job",
   *   timestamp: "2026-05-01T08:00:00Z",
   *   results: [MarketAnalysisResultDTO[], ...],
   *   channelId: "123456789"
   * }
   */
  router.post('/market-results', marketResultsController(discordClient, logger));

  return router;
};
