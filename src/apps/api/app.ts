import express, { Express } from 'express';
import { Client as DiscordClient } from 'discord.js';
import { logger } from '@/shared/logger';
import { IEventBus } from '@/shared/event-bus';
import { createHealthRoutes } from './routes/health';
import { createWorkerRoutes } from './routes/workers';
import path from 'path';

export const createExpressApp = (
  discordClient?: DiscordClient,
  eventBus?: IEventBus
): Express => {
  const app = express();
  app.use(express.json());
  app.use(createHealthRoutes());
  app.use('/workers', createWorkerRoutes(eventBus));
  app.use('/web', express.static(path.join(process.cwd(), 'src/interfaces/web/public')));

  return app;
};

export const startExpressApp = (
  port: number,
  discordClient?: DiscordClient,
  eventBus?: IEventBus
) => {
  const app = createExpressApp(discordClient, eventBus);

  app.listen(port, () => {
    logger.info(`API server running on http://localhost:${port}`);
  });
};
