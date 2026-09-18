import { Client, WebhookClient } from 'discord.js';
import { IEventBus } from '@/shared/event-bus';
import {
  GenerateResponseCompletedEvent,
  GenerateResponseFailedEvent,
  SummarizeContentCompletedEvent,
  SummarizeContentFailedEvent,
} from '@/modules/llm/events';
import { logging } from '@/shared/logger';

const MAX_MESSAGE_LENGTH = 2000;

export interface LlmResponseSubscriber {
  unsubscribe(): void;
}

const splitIntoChunks = (text: string): string[] => {
  if (text.length <= MAX_MESSAGE_LENGTH) return [text];

  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_MESSAGE_LENGTH) {
      chunks.push(remaining);
      break;
    }

    let cutAt = remaining.lastIndexOf('\n', MAX_MESSAGE_LENGTH);
    if (cutAt <= 0) cutAt = remaining.lastIndexOf(' ', MAX_MESSAGE_LENGTH);
    if (cutAt <= 0) cutAt = MAX_MESSAGE_LENGTH;
    chunks.push(remaining.substring(0, cutAt).trimEnd());
    remaining = remaining.substring(cutAt).trimStart();
  }
  return chunks;
};

export function createLlmResponseSubscriber(
  eventBus: IEventBus,
  client: Client
): LlmResponseSubscriber {
  const unsubscribeMessageCompleted = eventBus.subscribe<GenerateResponseCompletedEvent>(
    'llm:generate-response:completed',
    async (event) => {
      const response = event.data.response;
      if (event.data.responseContext.type !== 'discord-message') return;

      const channel = await client.channels.fetch(event.data.responseContext.channelId);
      if (!channel?.isTextBased() || !('messages' in channel)) return;
      const message = await channel.messages.fetch(event.data.responseContext.messageId);
      await message.reply(
        response.length > MAX_MESSAGE_LENGTH
          ? `${response.substring(0, MAX_MESSAGE_LENGTH - 3)}...`
          : response
      );
      logging.llm.responseGenerated({
        promptLength: event.data.responseContext.promptLength,
        responseLength: response.length,
      });
    }
  );

  const unsubscribeMessageFailed = eventBus.subscribe<GenerateResponseFailedEvent>(
    'llm:generate-response:failed',
    async (event) => {
      if (event.data.responseContext.type !== 'discord-message') return;
      const channel = await client.channels.fetch(event.data.responseContext.channelId);
      if (!channel?.isTextBased() || !('messages' in channel)) return;
      const message = await channel.messages.fetch(event.data.responseContext.messageId);
      logging.llm.responseFailed({ error: event.data.error });
      await message.reply('Sorry, I encountered an error processing your message.');
    }
  );

  const unsubscribeSummaryCompleted = eventBus.subscribe<SummarizeContentCompletedEvent>(
    'llm:summarize-content:completed',
    async (event) => {
      if (event.data.responseContext.type !== 'discord-interaction') return;
      const webhook = new WebhookClient({
        id: event.data.responseContext.applicationId,
        token: event.data.responseContext.interactionToken,
      });
      const chunks = splitIntoChunks(
        `TLDR: ${event.data.responseContext.url}\n\n${event.data.summary}`
      );
      const [firstChunk, ...restChunks] = chunks;
      if (firstChunk) await webhook.editMessage('@original', { content: firstChunk });
      for (const chunk of restChunks) await webhook.send({ content: chunk });
      webhook.destroy();
    }
  );

  const unsubscribeSummaryFailed = eventBus.subscribe<SummarizeContentFailedEvent>(
    'llm:summarize-content:failed',
    async (event) => {
      if (event.data.responseContext.type !== 'discord-interaction') return;
      const webhook = new WebhookClient({
        id: event.data.responseContext.applicationId,
        token: event.data.responseContext.interactionToken,
      });
      await webhook.editMessage('@original', { content: `❌ ${event.data.error}` });
      webhook.destroy();
    }
  );

  return {
    unsubscribe() {
      unsubscribeMessageCompleted();
      unsubscribeMessageFailed();
      unsubscribeSummaryCompleted();
      unsubscribeSummaryFailed();
    },
  };
}
