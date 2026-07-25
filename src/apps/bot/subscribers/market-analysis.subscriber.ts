import { Client as DiscordClient, EmbedBuilder } from 'discord.js';
import { logging } from '@/shared/logger';
import { IEventBus, MarketAnalysisCompleteEvent, MarketAnalysisErrorEvent } from '@/shared/event-bus';
import { WorkerWebhookPayload } from '@/modules/market-analysis/contracts/market-results.dto';
import { AnalyzeTickersDiscordResultUseCase } from '@/modules/market-analysis/application/usecases/analyze-tickers-discord-result.usecase';

/**
 * Subscribe to market analysis events from the worker
 * Delivers market analysis results to Discord channel
 *
 * This subscriber lives in the bot to ensure delivery happens
 * in the same process as the Discord client connection.
 */
export const registerMarketAnalysisSubscriber = (
  discordClient: DiscordClient,
  eventBus: IEventBus
): void => {
  // Subscribe to successful market analysis completion
  eventBus.subscribe<MarketAnalysisCompleteEvent>(
    'market-analysis:complete',
    async (event) => {
      const traceId = event.timestamp.toISOString();
      try {
        logging.bot.analysisReceived({ traceId, resultsCount: event.data.results.length });

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
        const useCase = new AnalyzeTickersDiscordResultUseCase();
        const { embeds, channelId } = useCase.execute(payload);

        // Get Discord channel
        const channel = await discordClient.channels.fetch(channelId);

        if (!channel?.isTextBased()) {
          logging.bot.analysisInvalidChannel({ traceId, channelId });
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

        logging.bot.analysisDelivered({ traceId, channelId, messageCount: chunks.length, embeds: embeds.length });
      } catch (error) {
        logging.bot.analysisDeliveryFailed({ traceId, error });
      }
    }
  );

  // Subscribe to market analysis errors
  eventBus.subscribe<MarketAnalysisErrorEvent>(
    'market-analysis:error',
    async (event) => {
      const traceId = event.timestamp.toISOString();
      try {
        logging.bot.analysisErrorReceived({ traceId, error: event.data.error });
        // Optional: send error notification to admin channel
      } catch (error) {
        logging.bot.analysisErrorDeliveryFailed({ traceId, error });
      }
    }
  );

  logging.bot.subscribersRegistered({ domain: 'market analysis' });
};
