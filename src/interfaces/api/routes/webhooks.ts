import { Router } from 'express';
import { Client as DiscordClient } from 'discord.js';
import { Logger } from 'pino';
import { deliverMarketResults } from '../controllers/market-analysis.controller';

export const createWebhookRoutes = (
  discordClient: DiscordClient,
  logger: Logger
): Router => {
  const router = Router();

  /**
   * POST /webhooks/market-results
   * DEPRECATED: Use event bus instead (market-analysis:complete event)
   * Kept for backward compatibility with external integrations
   * 
   * Receive market analysis results from external sources
   * 
   * Body: WorkerWebhookPayload
   * {
   *   source: "market-analysis-job",
   *   timestamp: "2026-05-01T08:00:00Z",
   *   results: [MarketAnalysisResultDTO[], ...],
   *   channelId: "123456789"
   * }
   */
  router.post('/market-results', deliverMarketResults(discordClient, logger));

  return router;
};
