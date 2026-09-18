import { ChatInputCommandInteraction, Message } from 'discord.js';
import { IEventBus } from '@/shared/event-bus';
import {
  GenerateResponseCompletedEvent,
  GenerateResponseFailedEvent,
  SummarizeContentCompletedEvent,
  SummarizeContentFailedEvent,
} from '@/modules/llm/events';
import { logging } from '@/shared/logger';

const MAX_MESSAGE_LENGTH = 2000;

type PendingMessage = { message: Message; promptLength: number };
type PendingSummary = { interaction: ChatInputCommandInteraction; url: string };

export interface LlmResponseSubscriber {
  registerMessage(traceId: string, message: Message, promptLength: number): void;
  registerSummary(traceId: string, interaction: ChatInputCommandInteraction, url: string): void;
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

export function createLlmResponseSubscriber(eventBus: IEventBus): LlmResponseSubscriber {
  const pendingMessages = new Map<string, PendingMessage>();
  const pendingSummaries = new Map<string, PendingSummary>();

  const unsubscribeMessageCompleted = eventBus.subscribe<GenerateResponseCompletedEvent>(
    'llm:generate-response:completed',
    async (event) => {
      const pending = pendingMessages.get(event.traceId);
      if (!pending) return;

      pendingMessages.delete(event.traceId);
      const response = event.data.response;
      await pending.message.reply(
        response.length > MAX_MESSAGE_LENGTH
          ? `${response.substring(0, MAX_MESSAGE_LENGTH - 3)}...`
          : response
      );
      logging.llm.responseGenerated({
        promptLength: pending.promptLength,
        responseLength: response.length,
      });
    }
  );

  const unsubscribeMessageFailed = eventBus.subscribe<GenerateResponseFailedEvent>(
    'llm:generate-response:failed',
    async (event) => {
      const pending = pendingMessages.get(event.traceId);
      if (!pending) return;

      pendingMessages.delete(event.traceId);
      logging.llm.responseFailed({ error: event.data.error });
      await pending.message.reply('Sorry, I encountered an error processing your message.');
    }
  );

  const unsubscribeSummaryCompleted = eventBus.subscribe<SummarizeContentCompletedEvent>(
    'llm:summarize-content:completed',
    async (event) => {
      const pending = pendingSummaries.get(event.traceId);
      if (!pending) return;

      pendingSummaries.delete(event.traceId);
      const chunks = splitIntoChunks(`TLDR: ${pending.url}\n\n${event.data.summary}`);
      const [firstChunk, ...restChunks] = chunks;
      if (firstChunk) await pending.interaction.editReply(firstChunk);
      for (const chunk of restChunks) await pending.interaction.followUp(chunk);
    }
  );

  const unsubscribeSummaryFailed = eventBus.subscribe<SummarizeContentFailedEvent>(
    'llm:summarize-content:failed',
    async (event) => {
      const pending = pendingSummaries.get(event.traceId);
      if (!pending) return;

      pendingSummaries.delete(event.traceId);
      await pending.interaction.editReply(`❌ ${event.data.error}`);
    }
  );

  return {
    registerMessage(traceId, message, promptLength) {
      pendingMessages.set(traceId, { message, promptLength });
    },
    registerSummary(traceId, interaction, url) {
      pendingSummaries.set(traceId, { interaction, url });
    },
    unsubscribe() {
      unsubscribeMessageCompleted();
      unsubscribeMessageFailed();
      unsubscribeSummaryCompleted();
      unsubscribeSummaryFailed();
      pendingMessages.clear();
      pendingSummaries.clear();
    },
  };
}
