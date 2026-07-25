import { Client as DiscordClient } from 'discord.js';
import { logging } from '@/shared/logger';
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
    traceId: string;
    timestamp: Date;
    data: {
      channelId: string;
      timestamp: string;
      summary: MarketSummary;
    };
  }>(
    'market-summary:complete',
    async (event) => {
      const traceId = event.traceId;
      try {
        logging.bot.summaryReceived({ traceId, totalTickers: event.data.summary.totalTickers });

        // Use the use case to format results
        const useCase = new MarketSummaryDiscordResultUseCase();
        const { embeds, title } = useCase.execute(event.data.summary);

        // Get Discord channel
        const channel = await discordClient.channels.fetch(event.data.channelId);

        if (!channel?.isTextBased()) {
          logging.bot.summaryInvalidChannel({ traceId, channelId: event.data.channelId });
          return;
        }

        // Send market summary embed
        if (channel.isTextBased() && 'send' in channel) {
          await channel.send({ embeds });
        }

        logging.bot.summaryDelivered({ traceId, channelId: event.data.channelId, title });
      } catch (error) {
        logging.bot.summaryDeliveryFailed({ traceId, error });
      }
    }
  );

  logging.bot.subscribersRegistered({ domain: 'market summary' });
};
