import express, { Express, Request, Response } from 'express';
import { Logger } from 'pino';

export const createExpressApp = (logger: Logger): Express => {
  const app = express();

  app.use(express.json());

  app.get('/ping', (req: Request, res: Response) => {
    logger.info({ endpoint: '/ping' }, 'Ping endpoint called');
    res.json({ message: 'pong' });
  });

  return app;
};

export const startExpressApp = (port: number, logger: Logger) => {
  const app = createExpressApp(logger);

  app.listen(port, () => {
    logger.info(`API server running on http://localhost:${port}`);
  });
};