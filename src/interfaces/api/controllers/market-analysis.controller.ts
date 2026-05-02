import { Request, Response } from 'express';
import { Client as DiscordClient } from 'discord.js';
import { Logger } from 'pino';
import { ProcessMarketAnalysisResultsUseCase } from '@/application/use-cases/ticker/process-market-results.usecase';
import { WorkerWebhookPayload } from '@/application/dto/market-results.dto';
import { IEventBus, WorkerMarketAnalysisTriggerEvent } from '@/shared';

export const triggerWorker = (
  logger: Logger,
  eventBus?: IEventBus
) => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info({ endpoint: '/workers/market-analysis' }, 'Market analysis worker triggered via API');

      if (!eventBus) {
        logger.warn('Event bus not available, cannot trigger worker');
        res.status(503).json({
          error: 'Event bus not initialized',
        });
        return;
      }

      // Publish worker trigger event
      const event: WorkerMarketAnalysisTriggerEvent = {
        type: 'worker:market-analysis:trigger',
        source: 'api',
        timestamp: new Date(),
      };

      await eventBus.publish(event);

      logger.info('Market analysis worker trigger event published');
      res.status(200).json({
        success: true,
        message: 'Market analysis worker triggered',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(error, 'Error triggering market analysis worker');
      res.status(500).json({
        error: message,
      });
    }
  };
};

/**
 * Market Results Controller
 * Receives webhook payloads from worker and delivers to Discord
 */
export const deliverMarketResults = (
  discordClient: DiscordClient,
  logger: Logger
) => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body as WorkerWebhookPayload;

      // Validate and process
      const useCase = new ProcessMarketAnalysisResultsUseCase();
      const { embeds, channelId } = useCase.execute(payload);

      // Get Discord channel
      const channel = await discordClient.channels.fetch(channelId);

      if (!channel?.isTextBased()) {
        logger.error({ channelId }, 'Invalid channel: not a text channel');
        res.status(400).json({
          error: 'Invalid channel: not a text channel',
        });
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
        'Market analysis results delivered to Discord'
      );

      res.status(200).json({
        success: true,
        message: 'Market analysis results delivered',
        messagesCount: chunks.length,
        embedsCount: embeds.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(error, 'Error processing market results webhook');
      res.status(400).json({
        error: message,
      });
    }
  };
};
