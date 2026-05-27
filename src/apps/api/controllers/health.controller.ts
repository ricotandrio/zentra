import { Request, Response } from 'express';
import { logger } from '@/shared/logger';

export const pingController = () => {
  return async (req: Request, res: Response): Promise<void> => {
    logger.info({
      source: 'api',
      operation: 'ping',
      request: { method: req.method, path: req.path },
      response: { statusCode: 200 },
    }, 'Ping endpoint called');
    res.json({ message: 'pong' });
  };
};
