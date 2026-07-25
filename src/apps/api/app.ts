import express, { Express } from 'express';
import { Runtime } from '@/shared/runtime';
import { createHealthRoutes } from './routes/health';
import { createWorkerRoutes } from './routes/workers';
import { createLogsRoutes } from './routes/logs';
import path from 'path';

export const createExpressApp = (runtime: Runtime): Express => {
  const app = express();
  app.use(express.json());
  app.use(createHealthRoutes());
  app.use('/workers', createWorkerRoutes(runtime.eventBus));
  app.use('/logs', createLogsRoutes());
  app.use('/web', express.static(path.join(process.cwd(), 'src/apps/web/public')));
  return app;
};

export const startExpressApp = (runtime: Runtime): void => {
  const app = createExpressApp(runtime);
  const port = runtime.config.EXPRESS.PORT;

  app.listen(port, () => {
    runtime.logging.api.serverStarted({ port });
  });
};
