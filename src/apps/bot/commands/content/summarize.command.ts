import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { IEventBus } from '@/shared/event-bus';
import {
  SummarizeContentRequestedEvent,
} from '@/modules/llm/events';
import { generateTraceId } from '@/shared/utils';

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
  _tickerManagementModule?: unknown
): Promise<void> {
  const url = interaction.options.getString('url', true);

  await interaction.deferReply();
  const traceId = generateTraceId();
  
  try {
    if (!eventBus) {
      await interaction.editReply('❌ Event bus is not available.');
      return;
    }

    const request: SummarizeContentRequestedEvent = {
      type: 'llm:summarize-content:requested',
      source: 'worker',
      timestamp: new Date(),
      traceId,
      data: {
        url,
        userId: interaction.user.id,
        responseContext: {
          type: 'discord-interaction',
          applicationId: interaction.applicationId,
          interactionToken: interaction.token,
          url,
        },
      },
    };
    await eventBus.publish(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to summarize content';
    await interaction.editReply(`Sorry, I encountered an error '${message}'`);
  }
}
