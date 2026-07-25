import { Logger } from 'pino';
import { RequestInfo, ResponseInfo } from './logging.service';

export const createApiLogger = (logger: Logger) => {
  return {
    serverStarted: (params: { port: number }) => {
      logger.info(
        { source: 'api', operation: 'server-startup', metadata: { port: params.port } },
        `API server running on http://localhost:${params.port}`
      );
    },

    ping: (params?: { request?: RequestInfo; response?: ResponseInfo }) => {
      logger.info(
        { source: 'api', operation: 'ping', request: params?.request, response: params?.response },
        'Ping endpoint called'
      );
    },

    triggerWorker: (params: { traceId: string; request?: RequestInfo }) => {
      logger.info(
        { source: 'api', operation: 'trigger-market-analysis-worker', traceId: params.traceId, request: params.request },
        'Market analysis worker triggered via API'
      );
    },

    triggerWorkerEventBusUnavailable: (params?: { traceId?: string }) => {
      logger.warn(
        { source: 'api', operation: 'trigger-market-analysis-worker', traceId: params?.traceId, error: 'Event bus not available' },
        'Event bus not available, cannot trigger worker'
      );
    },

    triggerWorkerEventPublished: (params: { traceId: string }) => {
      logger.info(
        { source: 'api', operation: 'trigger-market-analysis-worker', traceId: params.traceId, response: { statusCode: 200 } },
        'Market analysis worker trigger event published'
      );
    },

    triggerWorkerFailed: (params: { error: unknown }) => {
      logger.error(
        { source: 'api', operation: 'trigger-market-analysis-worker', error: params.error, response: { statusCode: 500 } },
        'Error triggering market analysis worker'
      );
    },

    queryLogs: (params?: { request?: RequestInfo }) => {
      logger.info(
        { source: 'api', operation: 'query-logs', request: params?.request },
        'Fetching logs with LogQL query'
      );
    },

    queryLogsFetched: (params: { resultCount: number; total: number }) => {
      logger.info(
        { source: 'api', operation: 'query-logs', response: { statusCode: 200 }, metadata: { resultCount: params.resultCount, total: params.total } },
        'Logs fetched successfully'
      );
    },

    queryLogsFailed: (params: { error: unknown }) => {
      logger.error(
        { source: 'api', operation: 'query-logs', error: params.error, response: { statusCode: 500 } },
        'Error querying logs'
      );
    },

    logsStats: (params?: { request?: RequestInfo }) => {
      logger.info(
        { source: 'api', operation: 'logs-stats', request: params?.request },
        'Fetching logs statistics'
      );
    },

    logsStatsFetched: (params: { logCount: number }) => {
      logger.info(
        { source: 'api', operation: 'logs-stats', response: { statusCode: 200 }, metadata: { logCount: params.logCount } },
        'Logs statistics fetched successfully'
      );
    },

    logsStatsFailed: (params: { error: unknown }) => {
      logger.error(
        { source: 'api', operation: 'logs-stats', error: params.error, response: { statusCode: 500 } },
        'Error fetching logs statistics'
      );
    },
  };
};
