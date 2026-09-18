import { Logger } from 'pino';

export const createEventBusLogger = (logger: Logger) => {
  return {
    eventPublished: (params: { source: string; eventType: string; traceId?: string }) => {
      logger.info(
        { source: params.source, operation: `publish-${params.eventType}`, traceId: params.traceId, event: { type: params.eventType } },
        `Event published: ${params.eventType}`
      );
    },

    handlerFailed: (params: { source: string; eventType: string; traceId?: string; error: unknown }) => {
      logger.error(
        { source: params.source, operation: `handle-${params.eventType}`, traceId: params.traceId, error: params.error },
        `Event handler failed for ${params.eventType}`
      );
    },
  };
};
