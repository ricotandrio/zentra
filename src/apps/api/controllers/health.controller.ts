import { Request, Response } from 'express';
import { logging } from '@/shared/logger';

export const pingController = () => {
  return async (req: Request, res: Response): Promise<void> => {
    logging.api.ping({
      request: { method: req.method, path: req.path },
      response: { statusCode: 200 },
    });
    res.json({ message: 'pong' });
  };
};
