import { Message } from 'discord.js';
import { logging } from '@/shared/logger';
import { IEventBus } from '@/shared/event-bus';

/**
 * Natural language message handler
 * TODO: Replace echo with LLM orchestration
 */
export const handleNaturalLanguageMessage = async (
  message: Message,
  _eventBus?: IEventBus
) => {
  try {
    // TODO: Implement LLM-based intent routing
    // For now, just echo back the user's message
    const content = message.content.replace(/<@!?(\d+)>/, '').trim();
    const response = `You said: ${content}`;

    await message.reply(response);
    logging.bot.messageHandled({ userId: message.author.id, contentLength: content.length });
  } catch (error) {
    logging.bot.messageFailed({ userId: message.author.id, error });
    await message.reply('Sorry, I encountered an error processing your message.');
  }
};
