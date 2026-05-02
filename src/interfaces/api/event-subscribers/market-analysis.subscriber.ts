import { Client as DiscordClient } from 'discord.js';
import { Logger } from 'pino';
import { IEventBus, MarketAnalysisCompleteEvent, MarketAnalysisErrorEvent } from '@/shared/event-bus';
import { ProcessMarketAnalysisResultsUseCase } from '@/application/use-cases/ticker/process-market-results.usecase';

/**
 * Subscribe to market analysis events from the worker
 * Delivers market analysis results to Discord
 */
export const subscribeToMarketAnalysisEvents = (
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
          'Received market analysis complete event'
        );

        // Convert event data to webhook payload format
        const payload = {
          source: 'market-analysis-job',
          timestamp: event.data.timestamp,
          results: event.data.results,
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
        const chunks: typeof embeds[][] = [];
        for (let i = 0; i < embeds.length; i += 10) {
          chunks.push(embeds.slice(i, i + 10));
        }

        // Send first chunk
        await channel.send({ embeds: chunks[0] });

        // Send remaining chunks as follow-ups
        for (let i = 1; i < chunks.length; i++) {
          await channel.send({ embeds: chunks[i] });
        }

        logger.info(
          { channelId, messageCount: chunks.length, embeds: embeds.length },
          'Market analysis results delivered to Discord via event bus'
        );
      } catch (error) {
        logger.error(error, 'Error handling market analysis complete event');
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
          'Market analysis job failed - error event received'
        );
        // You could send an error notification to Discord here if desired
      } catch (error) {
        logger.error(error, 'Error handling market analysis error event');
      }
    }
  );

  logger.info('Market analysis event subscribers initialized');
};
