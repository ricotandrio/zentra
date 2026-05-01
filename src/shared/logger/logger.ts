import pino, { Logger } from 'pino';

let loggerInstance: Logger;

const createLogger = (): Logger => {
  return pino(
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
};

export const getLogger = (): Logger => {
  if (!loggerInstance) {
    loggerInstance = createLogger();
  }
  return loggerInstance;
};
