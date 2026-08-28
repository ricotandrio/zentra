import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { IEventBus } from '@/shared/event-bus';
import { TickerManagementModule } from '@/modules/ticker-management';
import { ContentSummaryModule } from '@/modules/content-summary';
import { ScheduledQueriesModule } from '@/modules/scheduled-queries';

export const data = new SlashCommandBuilder()
  .setName('queries')
  .setDescription('List all scheduled queries');

export async function execute(
  interaction: ChatInputCommandInteraction,
  _eventBus?: IEventBus,
  _tickerManagementModule?: TickerManagementModule,
  _contentSummaryModule?: ContentSummaryModule,
  scheduledQueriesModule?: ScheduledQueriesModule
): Promise<void> {
  if (!scheduledQueriesModule) {
    await interaction.reply({ content: '❌ Scheduled queries module is not available.', ephemeral: true });
    return;
  }

  await interaction.deferReply();

  try {
    const queries = await scheduledQueriesModule.listQueriesUseCase.execute();

    if (queries.length === 0) {
      await interaction.editReply('No scheduled queries found.');
      return;
    }

    const lines = queries.map((q) => {
      const status = q.enabled ? '✅' : '❌';
      return `${status} **#${q.id}** — **${q.name}**`;
    });

    const embed = new EmbedBuilder()
      .setTitle('📋 Scheduled Queries')
      .setDescription(lines.join('\n'))
      .setColor(0x5865f2)
      .setFooter({ text: `${queries.length} query(ies)` });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await interaction.editReply(`❌ Failed to fetch queries: ${message}`);
  }
}
