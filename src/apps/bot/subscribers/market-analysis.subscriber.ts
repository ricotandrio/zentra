import { Client as DiscordClient, EmbedBuilder } from 'discord.js';
import { Logger } from 'pino';
import { IEventBus, MarketAnalysisCompleteEvent, MarketAnalysisErrorEvent } from '@/shared/event-bus';
import { WorkerWebhookPayload } from '@/modules/market-analysis/contracts/market-results.dto';
import { ProcessMarketAnalysisResultsUseCase } from '@/modules/market-analysis/application/usecases/process-market-results.usecase';

/**
 * Subscribe to market analysis events from the worker
 * Delivers market analysis results to Discord channel
 *
 * This subscriber lives in the bot to ensure delivery happens
 * in the same process as the Discord client connection.
 */
export const registerMarketAnalysisSubscriber = (
  discordClient: DiscordClient,
  eventBus: IEventBus,
  logger: Logger
): void => {
  // Subscribe to successful market analysis completion
  eventBus.subscribe<MarketAnalysisCompleteEvent>(
    'market-analysis:complete',
    async (event) => {
      try {
        logger.info(
          { resultsCount: event.data.results.length },
          'Bot received market analysis complete event'
        );

        // Parse sentiment strings back to objects and convert to use case payload format
        const results = event.data.results.map((r) => {
          const [label, scoreStr] = r.sentiment.split(':');
          return {
            ...r,
            sentiment: {
              label: label as 'bullish' | 'bearish' | 'neutral',
              score: parseFloat(scoreStr || '0'),
              signals: [],
            },
          };
        });

        const payload: WorkerWebhookPayload = {
          source: 'market-analysis-job',
          timestamp: event.data.timestamp,
          results,
          channelId: event.data.channelId,
        };

        // Use the existing use case to process and format results
        const useCase = new ProcessMarketAnalysisResultsUseCase();
        const { embeds, channelId } = useCase.execute(payload);

        // Get Discord channel
        const channel = await discordClient.channels.fetch(channelId);

        if (!channel?.isTextBased()) {
          logger.error({ channelId }, 'Invalid channel: not a text channel');
          return;
        }

        // Split embeds into chunks (Discord limit: 10 embeds per message)
        const chunks: EmbedBuilder[][] = [];
        for (let i = 0; i < embeds.length; i += 10) {
          chunks.push(embeds.slice(i, i + 10));
        }

        // Send all chunks
        for (const chunk of chunks) {
          if (channel.isTextBased() && 'send' in channel) {
            await channel.send({ embeds: chunk });
          }
        }

        logger.info(
          { channelId, messageCount: chunks.length, embeds: embeds.length },
          'Market analysis results delivered to Discord'
        );
      } catch (error) {
        logger.error(error, 'Error handling market analysis complete event in bot');
      }
    }
  );

  // Subscribe to market analysis errors
  eventBus.subscribe<MarketAnalysisErrorEvent>(
    'market-analysis:error',
    async (event) => {
      try {
        logger.error(
          { error: event.data.error },
          'Market analysis job failed - bot received error event'
        );
        // Optional: send error notification to admin channel
      } catch (error) {
        logger.error(error, 'Error handling market analysis error event in bot');
      }
    }
  );

  logger.info('Bot market analysis event subscribers registered');
};
