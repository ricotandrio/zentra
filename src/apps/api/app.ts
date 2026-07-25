import express, { Express } from 'express';
import { logging } from '@/shared/logger';
import { IEventBus } from '@/shared/event-bus';
import { createHealthRoutes } from './routes/health';
import { createWorkerRoutes } from './routes/workers';
import { createLogsRoutes } from './routes/logs';
import path from 'path';

export const createExpressApp = (
  eventBus?: IEventBus
): Express => {
  const app = express();
  app.use(express.json());
  app.use(createHealthRoutes());
  app.use('/workers', createWorkerRoutes(eventBus));
  app.use('/logs', createLogsRoutes());
  app.use('/web', express.static(path.join(process.cwd(), 'src/apps/web/public')));

  return app;
};

export const startExpressApp = (
  port: number,
  eventBus?: IEventBus
) => {
  const app = createExpressApp(eventBus);

  app.listen(port, () => {
    logging.api.serverStarted({ port });
  });
};
