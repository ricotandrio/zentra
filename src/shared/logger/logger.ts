import pino, { Logger } from 'pino';
import path from 'path';

export interface LogContext {
  source: 'api' | 'bot' | 'worker' | 'system';
  operation?: string;
  requestId?: string;
  eventId?: string;
  request?: {
    method?: string;
    path?: string;
    params?: unknown;
    query?: unknown;
    body?: unknown;
  };
  event?: {
    type: string;
    payload?: unknown;
  };
  response?: {
    statusCode?: number;
    body?: unknown;
  };
  metadata?: Record<string, unknown>;
  error?: unknown;
}

const getLogPath = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  return path.join(process.cwd(), 'data', 'log', dateStr, 'app.log');
};

export const logger: Logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  pino.transport({
    targets: [
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: false,
          translateTime: 'SYS:standard',
        },
      },
      {
        target: 'pino/file',
        options: {
          destination: getLogPath(),
          mkdir: true,
        },
      },
    ],
  })
);
