import express, { Express } from 'express';
import { Client as DiscordClient } from 'discord.js';
import { Logger } from 'pino';
import { createWebhookRoutes } from './routes/webhooks';
import { createHealthRoutes } from './routes/health';
import { createWorkerRoutes } from './routes/workers';

export const createExpressApp = (
  logger: Logger,
  discordClient?: DiscordClient
): Express => {
  const app = express();
  app.use(express.json());

  app.use(createHealthRoutes(logger));
  app.use('/workers', createWorkerRoutes(logger));

  if (discordClient) {
    app.use('/webhooks', createWebhookRoutes(discordClient, logger));
    logger.info('Webhook routes registered');
  } else {
    logger.warn('Discord client not available - webhook routes disabled');
  }

  return app;
};

export const startExpressApp = (
  port: number,
  logger: Logger,
  discordClient?: DiscordClient
) => {
  const app = createExpressApp(logger, discordClient);

  app.listen(port, () => {
    logger.info(`API server running on http://localhost:${port}`);
  });
};
