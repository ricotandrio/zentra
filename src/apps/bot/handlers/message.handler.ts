import { Message } from 'discord.js';
import { logger } from '@/shared/logger';
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
    logger.info({ userId: message.author.id }, `Echoed message: ${content}`);
  } catch (error) {
    logger.error(error, 'Error handling natural language message');
    await message.reply('Sorry, I encountered an error processing your message.');
  }
};
