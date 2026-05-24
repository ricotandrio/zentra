import { Request, Response } from 'express';
import { logger } from '@/shared/logger';

export const pingController = () => {
  return async (req: Request, res: Response): Promise<void> => {
    logger.info({ endpoint: '/ping' }, 'Ping endpoint called');
    res.json({ message: 'pong' });
  };
};
