import { Logger } from 'pino';
import { logger as defaultLogger } from './logger';

interface RequestInfo {
  method?: string;
  path?: string;
  params?: unknown;
  query?: unknown;
  body?: unknown;
}

interface ResponseInfo {
  statusCode?: number;
  body?: unknown;
}

export class LoggingService {
  private logger: Logger;

  constructor(logger: Logger = defaultLogger) {
    this.logger = logger;
  }

  readonly api = {
    serverStarted: (params: { port: number }) => {
      this.logger.info(
        { source: 'api', operation: 'server-startup', metadata: { port: params.port } },
        `API server running on http://localhost:${params.port}`
      );
    },

    ping: (params?: { request?: RequestInfo; response?: ResponseInfo }) => {
      this.logger.info(
        { source: 'api', operation: 'ping', request: params?.request, response: params?.response },
        'Ping endpoint called'
      );
    },

    triggerWorker: (params: { traceId: string; request?: RequestInfo }) => {
      this.logger.info(
        { source: 'api', operation: 'trigger-market-analysis-worker', traceId: params.traceId, request: params.request },
        'Market analysis worker triggered via API'
      );
    },

    triggerWorkerEventBusUnavailable: (params?: { traceId?: string }) => {
      this.logger.warn(
        { source: 'api', operation: 'trigger-market-analysis-worker', traceId: params?.traceId, error: 'Event bus not available' },
        'Event bus not available, cannot trigger worker'
      );
    },

    triggerWorkerEventPublished: (params: { traceId: string }) => {
      this.logger.info(
        { source: 'api', operation: 'trigger-market-analysis-worker', traceId: params.traceId, response: { statusCode: 200 } },
        'Market analysis worker trigger event published'
      );
    },

    triggerWorkerFailed: (params: { error: unknown }) => {
      this.logger.error(
        { source: 'api', operation: 'trigger-market-analysis-worker', error: params.error, response: { statusCode: 500 } },
        'Error triggering market analysis worker'
      );
    },

    queryLogs: (params?: { request?: RequestInfo }) => {
      this.logger.info(
        { source: 'api', operation: 'query-logs', request: params?.request },
        'Fetching logs with LogQL query'
      );
    },

    queryLogsFetched: (params: { resultCount: number; total: number }) => {
      this.logger.info(
        { source: 'api', operation: 'query-logs', response: { statusCode: 200 }, metadata: { resultCount: params.resultCount, total: params.total } },
        'Logs fetched successfully'
      );
    },

    queryLogsFailed: (params: { error: unknown }) => {
      this.logger.error(
        { source: 'api', operation: 'query-logs', error: params.error, response: { statusCode: 500 } },
        'Error querying logs'
      );
    },

    logsStats: (params?: { request?: RequestInfo }) => {
      this.logger.info(
        { source: 'api', operation: 'logs-stats', request: params?.request },
        'Fetching logs statistics'
      );
    },

    logsStatsFetched: (params: { logCount: number }) => {
      this.logger.info(
        { source: 'api', operation: 'logs-stats', response: { statusCode: 200 }, metadata: { logCount: params.logCount } },
        'Logs statistics fetched successfully'
      );
    },

    logsStatsFailed: (params: { error: unknown }) => {
      this.logger.error(
        { source: 'api', operation: 'logs-stats', error: params.error, response: { statusCode: 500 } },
        'Error fetching logs statistics'
      );
    },
  };

  readonly bot = {
    startup: () => {
      this.logger.info(
        { source: 'bot', operation: 'startup' },
        'Discord bot started'
      );
    },

    login: (params: { tag?: string }) => {
      this.logger.info(
        { source: 'bot', operation: 'login', metadata: { tag: params.tag } },
        `Bot logged in as ${params.tag}`
      );
    },

    deployCommands: (params: { commandCount: number }) => {
      this.logger.info(
        { source: 'bot', operation: 'deploy-commands', metadata: { commandCount: params.commandCount } },
        `Slash commands registered successfully (${params.commandCount} commands)`
      );
    },

    deployCommandsNoCommands: () => {
      this.logger.warn(
        { source: 'bot', operation: 'deploy-commands' },
        'No bot commands to deploy'
      );
    },

    deployCommandsInvalidCommand: (params: { cmd: unknown }) => {
      this.logger.error(
        { source: 'bot', operation: 'deploy-commands', error: 'Invalid command detected', metadata: { cmd: params.cmd } },
        'Invalid command detected'
      );
    },

    deployCommandsFailed: (params: { error: unknown }) => {
      this.logger.error(
        { source: 'bot', operation: 'deploy-commands', error: params.error },
        'Error deploying bot commands'
      );
    },

    commandFailed: (params: { commandName: string; error: unknown }) => {
      this.logger.error(
        { source: 'bot', operation: 'execute-command', metadata: { commandName: params.commandName }, error: params.error },
        `Error executing command: ${params.commandName}`
      );
    },

    clientError: (params: { error: unknown }) => {
      this.logger.error(
        { source: 'bot', operation: 'client-error', error: params.error },
        'Discord client error'
      );
    },

    messageHandled: (params: { userId: string; contentLength: number }) => {
      this.logger.info(
        { source: 'bot', operation: 'handle-message', metadata: { userId: params.userId, contentLength: params.contentLength } },
        'Echoed message'
      );
    },

    messageFailed: (params: { userId: string; error: unknown }) => {
      this.logger.error(
        { source: 'bot', operation: 'handle-message', metadata: { userId: params.userId }, error: params.error },
        'Error handling natural language message'
      );
    },

    subscribersRegistered: (params: { domain: string }) => {
      this.logger.info(
        { source: 'bot', operation: 'register-subscribers' },
        `Bot ${params.domain} event subscribers registered`
      );
    },

    analysisReceived: (params: { traceId: string; resultsCount: number }) => {
      this.logger.info(
        { source: 'bot', operation: 'deliver-market-analysis', traceId: params.traceId, eventId: new Date().toISOString(), metadata: { resultsCount: params.resultsCount } },
        'Bot received market analysis complete event'
      );
    },

    analysisDelivered: (params: { traceId: string; channelId: string; messageCount: number; embeds: number }) => {
      this.logger.info(
        { source: 'bot', operation: 'deliver-market-analysis', traceId: params.traceId, metadata: { channelId: params.channelId, messageCount: params.messageCount, embeds: params.embeds } },
        'Market analysis results delivered to Discord'
      );
    },

    analysisInvalidChannel: (params: { traceId: string; channelId: string }) => {
      this.logger.error(
        { source: 'bot', operation: 'deliver-market-analysis', traceId: params.traceId, metadata: { channelId: params.channelId }, error: 'Invalid channel: not a text channel' },
        'Invalid channel: not a text channel'
      );
    },

    analysisDeliveryFailed: (params: { traceId: string; error: unknown }) => {
      this.logger.error(
        { source: 'bot', operation: 'deliver-market-analysis', traceId: params.traceId, error: params.error },
        'Error handling market analysis complete event in bot'
      );
    },

    analysisErrorReceived: (params: { traceId: string; error: unknown }) => {
      this.logger.error(
        { source: 'bot', operation: 'handle-market-analysis-error', traceId: params.traceId, eventId: new Date().toISOString(), error: params.error },
        'Market analysis job failed - bot received error event'
      );
    },

    analysisErrorDeliveryFailed: (params: { traceId: string; error: unknown }) => {
      this.logger.error(
        { source: 'bot', operation: 'handle-market-analysis-error', traceId: params.traceId, error: params.error },
        'Error handling market analysis error event in bot'
      );
    },

    summaryReceived: (params: { traceId: string; totalTickers: number }) => {
      this.logger.info(
        { source: 'bot', operation: 'deliver-market-summary', traceId: params.traceId, eventId: new Date().toISOString(), metadata: { totalTickers: params.totalTickers } },
        'Bot received market summary event'
      );
    },

    summaryDelivered: (params: { traceId: string; channelId: string; title?: string }) => {
      this.logger.info(
        { source: 'bot', operation: 'deliver-market-summary', traceId: params.traceId, metadata: { channelId: params.channelId, title: params.title } },
        'Market summary delivered to Discord'
      );
    },

    summaryInvalidChannel: (params: { traceId: string; channelId: string }) => {
      this.logger.error(
        { source: 'bot', operation: 'deliver-market-summary', traceId: params.traceId, metadata: { channelId: params.channelId }, error: 'Invalid channel: not a text channel' },
        'Invalid channel: not a text channel'
      );
    },

    summaryDeliveryFailed: (params: { traceId: string; error: unknown }) => {
      this.logger.error(
        { source: 'bot', operation: 'deliver-market-summary', traceId: params.traceId, error: params.error },
        'Error handling market summary event in bot'
      );
    },
  };

  readonly marketAnalysis = {
    jobStarted: (params: { traceId: string }) => {
      this.logger.info(
        { source: 'worker', operation: 'market-analysis-job', traceId: params.traceId },
        'Starting market analysis job'
      );
    },

    noTickers: (params: { traceId: string }) => {
      this.logger.info(
        { source: 'worker', operation: 'market-analysis-job', traceId: params.traceId },
        'No tickers to analyze'
      );
    },

    jobFailed: (params: { traceId: string; error: unknown }) => {
      this.logger.error(
        { source: 'worker', operation: 'market-analysis-job', error: params.error, traceId: params.traceId },
        'Error executing market analysis job'
      );
    },

    tickersAnalyzed: (params: { tickerCount: number }) => {
      this.logger.info(
        { source: 'worker', operation: 'analyze-tickers', metadata: { tickerCount: params.tickerCount } },
        `Analyzing ${params.tickerCount} tickers`
      );
    },

    analysisPublished: (params: { traceId: string; resultsCount: number }) => {
      this.logger.info(
        { source: 'worker', operation: 'publish-market-analysis-complete', traceId: params.traceId, metadata: { resultsCount: params.resultsCount } },
        `Publishing market analysis complete event with ${params.resultsCount} results`
      );
    },

    analysisCompleted: (params: { analysisCount: number }) => {
      this.logger.info(
        { source: 'worker', operation: 'market-analysis-complete', metadata: { analysisCount: params.analysisCount } },
        `Market analysis completed with ${params.analysisCount} results`
      );
    },

    summaryFetching: () => {
      this.logger.info(
        { source: 'worker', operation: 'fetch-market-summary' },
        'Fetching market summary from market data source'
      );
    },

    summaryFetchFailed: (params: { error: unknown }) => {
      this.logger.warn(
        { source: 'worker', operation: 'fetch-market-summary', error: params.error },
        'Failed to fetch market summary, continuing without it'
      );
    },

    summaryPublished: (params: { traceId: string; totalTickers: number }) => {
      this.logger.info(
        { source: 'worker', operation: 'publish-market-summary', traceId: params.traceId, metadata: { totalTickers: params.totalTickers } },
        `Publishing market summary event with ${params.totalTickers} tickers`
      );
    },

    subscriberInit: () => {
      this.logger.info(
        { source: 'system', operation: 'market-analysis-subscriber-init' },
        'Market analysis subscriber initialized'
      );
    },

    triggerReceived: (params: { traceId?: string }) => {
      this.logger.info(
        { source: 'worker', operation: 'market-analysis-trigger', traceId: params.traceId },
        'Received market analysis trigger event - worker should start analysis'
      );
    },

    resultsReceived: (params: { traceId?: string; resultsCount: number; channelId: string }) => {
      this.logger.info(
        { source: 'worker', operation: 'market-analysis-complete', traceId: params.traceId, metadata: { resultsCount: params.resultsCount, channelId: params.channelId } },
        'Market analysis completed - results ready for delivery'
      );
    },

    sentimentDistribution: (params: { traceId?: string; sentiments: Record<string, number> }) => {
      this.logger.debug(
        { source: 'worker', operation: 'market-analysis-complete', traceId: params.traceId, metadata: { sentiments: params.sentiments } },
        'Sentiment distribution'
      );
    },

    errorReceived: (params: { traceId?: string; error: unknown }) => {
      this.logger.error(
        { source: 'worker', operation: 'market-analysis-error', traceId: params.traceId, error: params.error },
        'Market analysis job failed'
      );
    },
  };

  readonly scheduler = {
    started: (params: { schedule: string }) => {
      this.logger.info(
        { source: 'system', operation: 'market-analysis-scheduler-start', metadata: { schedule: params.schedule } },
        `Starting market analysis scheduler at ${params.schedule}`
      );
    },

    stopped: () => {
      this.logger.info(
        { source: 'system', operation: 'market-analysis-scheduler-stop' },
        'Market analysis scheduler stopped'
      );
    },

    jobFailed: (params: { jobName: string; error: unknown }) => {
      this.logger.error(
        { source: 'system', operation: 'scheduler-job', metadata: { jobName: params.jobName }, error: params.error },
        `[Scheduler] Job failed: ${params.jobName}`
      );
    },

    scheduledJobFailed: (params: { error: unknown }) => {
      this.logger.error(
        { source: 'system', operation: 'market-analysis-scheduler-job', error: params.error },
        'Scheduled market analysis job failed'
      );
    },
  };

  readonly eventBus = {
    eventPublished: (params: { source: string; eventType: string; traceId?: string }) => {
      this.logger.info(
        { source: params.source, operation: `publish-${params.eventType}`, traceId: params.traceId, event: { type: params.eventType } },
        `Event published: ${params.eventType}`
      );
    },

    handlerFailed: (params: { source: string; eventType: string; traceId?: string; error: unknown }) => {
      this.logger.error(
        { source: params.source, operation: `handle-${params.eventType}`, traceId: params.traceId, error: params.error },
        `Event handler failed for ${params.eventType}`
      );
    },
  };

  readonly system = {
    componentInitialized: (params: { component: string }) => {
      this.logger.info(
        { source: 'system', operation: 'database-init' },
        `${params.component} initialized`
      );
    },

    allStarted: () => {
      this.logger.info(
        'All systems started (API + Bot + Worker)'
      );
    },

    startupFailed: (params: { error: unknown }) => {
      this.logger.error(
        params.error,
        'Failed to start application'
      );
    },

    shutdown: () => {
      this.logger.info(
        'Shutting down...'
      );
    },
  };

  readonly infra = {
    scraperInitialized: () => {
      this.logger.info(
        { source: 'system', operation: 'market-scraper-init' },
        'Initializing market scraper adapter'
      );
    },

    scraperInitFailed: (params: { error: unknown }) => {
      this.logger.error(
        { source: 'system', operation: 'market-scraper-init', error: params.error },
        'Failed to initialize browser'
      );
    },

    scraperClosed: () => {
      this.logger.info(
        { source: 'system', operation: 'market-scraper-close' },
        'Market scraper adapter closed'
      );
    },

    rawDataFetching: () => {
      this.logger.info(
        { source: 'system', operation: 'market-scraper-fetch' },
        'Fetching raw trading summary from market data source'
      );
    },

    invalidResponse: () => {
      this.logger.error(
        { source: 'system', operation: 'market-scraper-fetch' },
        'Invalid market response format'
      );
    },

    rawDataFetched: (params: { tickerCount: number }) => {
      this.logger.info(
        { source: 'system', operation: 'market-scraper-fetch', metadata: { tickerCount: params.tickerCount } },
        `Retrieved ${params.tickerCount} tickers from market data source`
      );
    },

    rawDataFailed: (params: { error: unknown }) => {
      this.logger.error(
        { source: 'system', operation: 'market-scraper-fetch', error: params.error },
        'Failed to fetch market data'
      );
    },
  };
}

export const logging = new LoggingService();
