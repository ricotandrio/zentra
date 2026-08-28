import { Logger } from 'pino';

export const createBotLogger = (logger: Logger) => {
  return {
    startup: () => {
      logger.info(
        { source: 'bot', operation: 'startup' },
        'Discord bot started'
      );
    },

    login: (params: { tag?: string }) => {
      logger.info(
        { source: 'bot', operation: 'login', metadata: { tag: params.tag } },
        `Bot logged in as ${params.tag}`
      );
    },

    deployCommands: (params: { commandCount: number }) => {
      logger.info(
        { source: 'bot', operation: 'deploy-commands', metadata: { commandCount: params.commandCount } },
        `Slash commands registered successfully (${params.commandCount} commands)`
      );
    },

    deployCommandsNoCommands: () => {
      logger.warn(
        { source: 'bot', operation: 'deploy-commands' },
        'No bot commands to deploy'
      );
    },

    deployCommandsInvalidCommand: (params: { cmd: unknown }) => {
      logger.error(
        { source: 'bot', operation: 'deploy-commands', error: 'Invalid command detected', metadata: { cmd: params.cmd } },
        'Invalid command detected'
      );
    },

    deployCommandsFailed: (params: { error: unknown }) => {
      logger.error(
        { source: 'bot', operation: 'deploy-commands', error: params.error },
        'Error deploying bot commands'
      );
    },

    commandFailed: (params: { commandName: string; error: unknown }) => {
      logger.error(
        { source: 'bot', operation: 'execute-command', metadata: { commandName: params.commandName }, error: params.error },
        `Error executing command: ${params.commandName}`
      );
    },

    clientError: (params: { error: unknown }) => {
      logger.error(
        { source: 'bot', operation: 'client-error', error: params.error },
        'Discord client error'
      );
    },

    messageHandled: (params: { userId: string; contentLength: number }) => {
      logger.info(
        { source: 'bot', operation: 'handle-message', metadata: { userId: params.userId, contentLength: params.contentLength } },
        'Echoed message'
      );
    },

    messageFailed: (params: { userId: string; error: unknown }) => {
      logger.error(
        { source: 'bot', operation: 'handle-message', metadata: { userId: params.userId }, error: params.error },
        'Error handling natural language message'
      );
    },

    subscribersRegistered: (params: { domain: string }) => {
      logger.info(
        { source: 'bot', operation: 'register-subscribers' },
        `Bot ${params.domain} event subscribers registered`
      );
    },

    analysisReceived: (params: { traceId: string; resultsCount: number }) => {
      logger.info(
        { source: 'bot', operation: 'deliver-market-analysis', traceId: params.traceId, eventId: new Date().toISOString(), metadata: { resultsCount: params.resultsCount } },
        'Bot received market analysis complete event'
      );
    },

    analysisDelivered: (params: { traceId: string; channelId: string; messageCount: number; embeds: number }) => {
      logger.info(
        { source: 'bot', operation: 'deliver-market-analysis', traceId: params.traceId, metadata: { channelId: params.channelId, messageCount: params.messageCount, embeds: params.embeds } },
        'Market analysis results delivered to Discord'
      );
    },

    analysisInvalidChannel: (params: { traceId: string; channelId: string }) => {
      logger.error(
        { source: 'bot', operation: 'deliver-market-analysis', traceId: params.traceId, metadata: { channelId: params.channelId }, error: 'Invalid channel: not a text channel' },
        'Invalid channel: not a text channel'
      );
    },

    analysisDeliveryFailed: (params: { traceId: string; error: unknown }) => {
      logger.error(
        { source: 'bot', operation: 'deliver-market-analysis', traceId: params.traceId, error: params.error },
        'Error handling market analysis complete event in bot'
      );
    },

    analysisErrorReceived: (params: { traceId: string; error: unknown }) => {
      logger.error(
        { source: 'bot', operation: 'handle-market-analysis-error', traceId: params.traceId, eventId: new Date().toISOString(), error: params.error },
        'Market analysis job failed - bot received error event'
      );
    },

    analysisErrorDeliveryFailed: (params: { traceId: string; error: unknown }) => {
      logger.error(
        { source: 'bot', operation: 'handle-market-analysis-error', traceId: params.traceId, error: params.error },
        'Error handling market analysis error event in bot'
      );
    },

    summaryReceived: (params: { traceId: string; totalTickers: number }) => {
      logger.info(
        { source: 'bot', operation: 'deliver-market-summary', traceId: params.traceId, eventId: new Date().toISOString(), metadata: { totalTickers: params.totalTickers } },
        'Bot received market summary event'
      );
    },

    summaryDelivered: (params: { traceId: string; channelId: string; title?: string }) => {
      logger.info(
        { source: 'bot', operation: 'deliver-market-summary', traceId: params.traceId, metadata: { channelId: params.channelId, title: params.title } },
        'Market summary delivered to Discord'
      );
    },

    summaryInvalidChannel: (params: { traceId: string; channelId: string }) => {
      logger.error(
        { source: 'bot', operation: 'deliver-market-summary', traceId: params.traceId, metadata: { channelId: params.channelId }, error: 'Invalid channel: not a text channel' },
        'Invalid channel: not a text channel'
      );
    },

    summaryDeliveryFailed: (params: { traceId: string; error: unknown }) => {
      logger.error(
        { source: 'bot', operation: 'deliver-market-summary', traceId: params.traceId, error: params.error },
        'Error handling market summary event in bot'
      );
    },

    heartbeatDelivered: (params: { traceId: string; channelId: string }) => {
      logger.info(
        { source: 'bot', operation: 'deliver-heartbeat', traceId: params.traceId, metadata: { channelId: params.channelId } },
        'Heartbeat delivered to Discord'
      );
    },

    heartbeatInvalidChannel: (params: { traceId: string; channelId: string }) => {
      logger.error(
        { source: 'bot', operation: 'deliver-heartbeat', traceId: params.traceId, metadata: { channelId: params.channelId }, error: 'Invalid channel: not a text channel' },
        'Invalid channel: not a text channel'
      );
    },

    heartbeatDeliveryFailed: (params: { traceId: string; error: unknown }) => {
      logger.error(
        { source: 'bot', operation: 'deliver-heartbeat', traceId: params.traceId, error: params.error },
        'Error handling heartbeat event in bot'
      );
    },
  };
};
