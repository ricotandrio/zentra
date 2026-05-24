import { Request, Response } from 'express';
import { Logger } from 'pino';

export const pingController = (
  logger: Logger
) => {
  return async (req: Request, res: Response): Promise<void> => {
    logger.info({ endpoint: '/ping' }, 'Ping endpoint called');
    res.json({ message: 'pong' });
  };
};
