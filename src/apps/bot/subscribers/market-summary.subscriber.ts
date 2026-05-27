import { Client as DiscordClient } from 'discord.js';
import { logger } from '@/shared/logger';
import { IEventBus } from '@/shared/event-bus';
import { MarketSummaryDiscordResultUseCase } from '@/modules/market-analysis/application/usecases/market-summary-discord-result.usecase';
import { MarketSummary } from '@/modules/market-analysis/infrastructure/data-sources';

/**
 * Subscribe to market summary events from the worker
 * Delivers market summary to Discord channel
 *
 * This subscriber lives in the bot to ensure delivery happens
 * in the same process as the Discord client connection.
 */
export const registerMarketSummarySubscriber = (
  discordClient: DiscordClient,
  eventBus: IEventBus
): void => {
  // Subscribe to market summary completion
  eventBus.subscribe<{
    type: 'market-summary:complete';
    source: 'worker';
    timestamp: Date;
    data: {
      channelId: string;
      timestamp: string;
      summary: MarketSummary;
    };
  }>(
    'market-summary:complete',
    async (event) => {
      const traceId = event.timestamp.toISOString();
      try {
        logger.info({
          source: 'bot',
          operation: 'deliver-market-summary',
          traceId,
          eventId: event.timestamp.toISOString(),
          metadata: { totalTickers: event.data.summary.totalTickers },
        }, 'Bot received market summary event');

        // Use the use case to format results
        const useCase = new MarketSummaryDiscordResultUseCase();
        const { embeds, title } = useCase.execute(event.data.summary);

        // Get Discord channel
        const channel = await discordClient.channels.fetch(event.data.channelId);

        if (!channel?.isTextBased()) {
          logger.error({
            source: 'bot',
            operation: 'deliver-market-summary',
            traceId,
            metadata: { channelId: event.data.channelId },
            error: 'Invalid channel: not a text channel',
          }, 'Invalid channel: not a text channel');
          return;
        }

        // Send market summary embed
        if (channel.isTextBased() && 'send' in channel) {
          await channel.send({ embeds });
        }

        logger.info({
          source: 'bot',
          operation: 'deliver-market-summary',
          traceId,
          metadata: { channelId: event.data.channelId, title },
        }, 'Market summary delivered to Discord');
      } catch (error) {
        logger.error({
          source: 'bot',
          operation: 'deliver-market-summary',
          traceId,
          error,
        }, 'Error handling market summary event in bot');
      }
    }
  );

  logger.info({
    source: 'bot',
    operation: 'register-subscribers',
  }, 'Bot market summary event subscriber registered');
};
