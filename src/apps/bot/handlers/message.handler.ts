import { Message } from 'discord.js';
import { logging } from '@/shared/logger';
import { IEventBus } from '@/shared/event-bus';
import { GenerateResponseRequestedEvent } from '@/modules/llm/events';
import { generateTraceId } from '@/shared/utils';

export const handleNaturalLanguageMessage = async (
  message: Message,
  eventBus: IEventBus
) => {
  const content = message.content.replace(/<@!?(\d+)>/, '').trim();

  try {
    logging.llm.messageReceived({ userId: message.author.id });

    const traceId = generateTraceId();
    const request: GenerateResponseRequestedEvent = {
      type: 'llm:generate-response:requested',
      source: 'worker',
      timestamp: new Date(),
      traceId,
      data: {
        prompt: content,
        userId: message.author.id,
        responseContext: {
          type: 'discord-message',
          channelId: message.channel.id,
          messageId: message.id,
          promptLength: content.length,
        },
      },
    };
    await eventBus.publish(request);
  } catch (error) {
    logging.llm.responseFailed({ error });
    await message.reply('Sorry, I encountered an error processing your message.');
  }
};
