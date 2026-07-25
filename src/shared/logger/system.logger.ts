import { Logger } from 'pino';

export const createSystemLogger = (logger: Logger) => {
  return {
    componentInitialized: (params: { component: string }) => {
      logger.info(
        { source: 'system', operation: 'database-init' },
        `${params.component} initialized`
      );
    },

    allStarted: () => {
      logger.info(
        'All systems started (API + Bot + Worker)'
      );
    },

    startupFailed: (params: { error: unknown }) => {
      logger.error(
        params.error,
        'Failed to start application'
      );
    },

    shutdown: () => {
      logger.info(
        'Shutting down...'
      );
    },
  };
};
