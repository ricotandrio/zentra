import { Message } from 'discord.js';
import { logging } from '@/shared/logger';
import { LlmModule } from '@/modules/llm';

export const handleNaturalLanguageMessage = async (
  message: Message,
  llmModule?: LlmModule
) => {
  const content = message.content.replace(/<@!?(\d+)>/, '').trim();

  try {
    logging.llm.messageReceived({ userId: message.author.id });

    if (!llmModule) {
      await message.reply('LLM module is not available.');
      return;
    }

    const response = await llmModule.generate.execute(content);
    if (response.length > 2000) {
      await message.reply(response.substring(0, 1997) + '...');
    } else {
      await message.reply(response);
    }

    logging.llm.responseGenerated({ promptLength: content.length, responseLength: response.length });
  } catch (error) {
    logging.llm.responseFailed({ error });
    await message.reply('Sorry, I encountered an error processing your message.');
  }
};
