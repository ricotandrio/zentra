import pino, { Logger } from 'pino';

export const logger: Logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  pino.transport({
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: false,
      translateTime: 'SYS:standard',
    },
  })
);
