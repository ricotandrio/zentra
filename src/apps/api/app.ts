import express, { Express } from 'express';
import { Runtime } from '@/shared/runtime';
import { createHealthRoutes } from './routes/health';
import { createWorkerRoutes } from './routes/workers';
import { createLogsRoutes } from './routes/logs';
import path from 'path';

export const createExpressApp = (
  eventBus: Runtime['eventBus']
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
  eventBus: Runtime['eventBus'],
  config: Runtime['config']
): void => {
  const app = createExpressApp(eventBus);
  const port = config.express.port;

  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
};
