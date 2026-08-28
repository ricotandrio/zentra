import { Client as DiscordClient } from 'discord.js';
import { logging } from '@/shared/logger';
import { IEventBus, HeartbeatTickEvent } from '@/shared/event-bus';

/**
 * Subscribe to heartbeat tick events from the worker
 * Sends a keepalive message to the configured Discord channel
 * to keep the VM alive.
 *
 * This subscriber lives in the bot to ensure delivery happens
 * in the same process as the Discord client connection.
 */
export const registerHeartbeatSubscriber = (
  discordClient: DiscordClient,
  eventBus: IEventBus
): void => {
  eventBus.subscribe<HeartbeatTickEvent>(
    'heartbeat:tick',
    async (event) => {
      const traceId = event.traceId;
      try {
        const channel = await discordClient.channels.fetch(event.data.channelId);

        if (!channel?.isTextBased()) {
          logging.bot.heartbeatInvalidChannel({ traceId, channelId: event.data.channelId });
          return;
        }

        if (channel.isTextBased() && 'send' in channel) {
          await channel.send('Hello from Zentra');
        }

        logging.bot.heartbeatDelivered({ traceId, channelId: event.data.channelId });
      } catch (error) {
        logging.bot.heartbeatDeliveryFailed({ traceId, error });
      }
    }
  );

  logging.bot.subscribersRegistered({ domain: 'heartbeat' });
};
