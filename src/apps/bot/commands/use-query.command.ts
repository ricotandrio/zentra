import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { IEventBus } from '@/shared/event-bus';
import { TickerManagementModule } from '@/modules/ticker-management';
import { ContentSummaryModule } from '@/modules/content-summary';
import { ScheduledQueriesModule } from '@/modules/scheduled-queries';
import { markdownTableToPng } from '@/shared/utils';

const buildMarkdownTable = (columns: string[], rows: Record<string, unknown>[]): string => {
  const header = `| ${columns.join(' | ')} |`;
  const separator = `| ${columns.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map((row) => `| ${columns.map((column) => String(row[column] ?? '')).join(' | ')} |`);

  return [header, separator, ...dataRows].join('\n');
};

export const data = new SlashCommandBuilder()
  .setName('use-query')
  .setDescription('Execute a scheduled query by ID and return results')
  .addIntegerOption((option) =>
    option.setName('id').setDescription('The query ID to execute').setRequired(true)
  );

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

  const id = interaction.options.getInteger('id', true);

  await interaction.deferReply();

  try {
    const result = await scheduledQueriesModule.executeQueryUseCase.execute(id);

    if (result.rows.length === 0) {
      await interaction.editReply(`**Query #${id}** — 0 rows returned.`);
      return;
    }

    const markdownTable = buildMarkdownTable(result.columns, result.rows.slice(0, 10));

    try {
      const imageBuffer = await markdownTableToPng(markdownTable, { width: 900 });

      await interaction.editReply({
        content: `**Query #${id}** — ${result.rows.length} row(s)`,
        files: [{ attachment: imageBuffer, name: `query-${id}.png` }],
      });
      return;
    } catch {
      // Fallback to a plain message if the renderer fails at runtime.
      const message = `**Query #${id}** — ${result.rows.length} row(s)\nCould not render PNG preview.`;
      await interaction.editReply(message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await interaction.editReply(`❌ Error: ${message}`);
  }
}
