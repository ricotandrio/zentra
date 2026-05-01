import express, { Express, Request, Response } from 'express';
import { Client as DiscordClient } from 'discord.js';
import { Logger } from 'pino';
import { createWebhookRoutes } from './routes/webhooks';

export const createExpressApp = (
  logger: Logger,
  discordClient?: DiscordClient
): Express => {
  const app = express();

  app.use(express.json());

  app.get('/ping', (req: Request, res: Response) => {
    logger.info({ endpoint: '/ping' }, 'Ping endpoint called');
    res.json({ message: 'pong' });
  });

  // Register webhook routes if Discord client is available
  if (discordClient) {
    const webhookRoutes = createWebhookRoutes(discordClient, logger);
    app.use('/webhooks', webhookRoutes);
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
