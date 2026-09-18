import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { IEventBus } from '@/shared/event-bus';
import {
  SummarizeContentRequestedEvent,
} from '@/modules/llm/events';
import { generateTraceId } from '@/shared/utils';
import { LlmResponseSubscriber } from '../../subscribers/llm-response.subscriber';

export const data = new SlashCommandBuilder()
  .setName('summarize')
  .setDescription('Scrape a link and summarize its content with AI')
  .addStringOption((option) =>
    option
      .setName('url')
      .setDescription('The link to summarize (e.g., https://example.com/article)')
      .setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  eventBus?: IEventBus,
  _tickerManagementModule?: unknown,
  _scheduledQueriesModule?: unknown,
  responseSubscriber?: LlmResponseSubscriber
): Promise<void> {
  const url = interaction.options.getString('url', true);

  await interaction.deferReply();

  try {
    if (!eventBus) {
      await interaction.editReply('❌ Event bus is not available.');
      return;
    }

    if (!responseSubscriber) {
      await interaction.editReply('❌ LLM response subscriber is not available.');
      return;
    }

    const traceId = generateTraceId();
    const request: SummarizeContentRequestedEvent = {
      type: 'llm:summarize-content:requested',
      source: 'worker',
      timestamp: new Date(),
      traceId,
      data: {
        url,
        userId: interaction.user.id,
      },
    };
    responseSubscriber.registerSummary(traceId, interaction, url);
    await eventBus.publish(request);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to summarize content';
    await interaction.editReply(`❌ ${message}`);
  }
}
