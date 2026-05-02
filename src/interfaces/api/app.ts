import express, { Express } from 'express';
import { Client as DiscordClient } from 'discord.js';
import { Logger } from 'pino';
import { IEventBus } from '@/shared/event-bus';
import { createWebhookRoutes } from './routes/webhooks';
import { createHealthRoutes } from './routes/health';
import { createWorkerRoutes } from './routes/workers';
import { subscribeToMarketAnalysisEvents } from './event-subscribers/market-analysis.subscriber';
import path from 'node:path';

export const createExpressApp = (
  logger: Logger,
  discordClient?: DiscordClient,
  eventBus?: IEventBus
): Express => {
  const app = express();
  app.use(express.json());

  app.use(createHealthRoutes(logger));

  app.use('/workers', createWorkerRoutes(logger, eventBus));

  if (discordClient && eventBus) {
    app.use('/webhooks', createWebhookRoutes(discordClient, logger));
    logger.info('Webhook routes registered (legacy support)');
    
    // Subscribe to market analysis events from event bus
    subscribeToMarketAnalysisEvents(discordClient, eventBus, logger);
    logger.info('Market analysis event subscribers registered');
  } else {
    logger.warn('Discord client or event bus not available - event-based delivery disabled');
  }

  app.use('/web', express.static(path.join(__dirname, '../../interfaces/web/public')));

  return app;
};

export const startExpressApp = (
  port: number,
  logger: Logger,
  discordClient?: DiscordClient,
  eventBus?: IEventBus
) => {
  const app = createExpressApp(logger, discordClient, eventBus);

  app.listen(port, () => {
    logger.info(`API server running on http://localhost:${port}`);
  });
};
