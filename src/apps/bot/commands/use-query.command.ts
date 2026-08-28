import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { IEventBus } from '@/shared/event-bus';
import { TickerManagementModule } from '@/modules/ticker-management';
import { ContentSummaryModule } from '@/modules/content-summary';
import { ScheduledQueriesModule } from '@/modules/scheduled-queries';
import { formatAsMarkdownTable } from '@/modules/scheduled-queries/infrastructure/discord/table-formatter';

const MAX_MESSAGE_LENGTH = 2000;

const splitIntoChunks = (text: string, maxLength: number): string[] => {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    let cutAt = remaining.lastIndexOf('\n', maxLength);
    if (cutAt <= 0) cutAt = remaining.lastIndexOf(' ', maxLength);
    if (cutAt <= 0) cutAt = maxLength;

    chunks.push(remaining.substring(0, cutAt).trimEnd());
    remaining = remaining.substring(cutAt).trimStart();
  }

  return chunks;
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
    const table = formatAsMarkdownTable(result.columns, result.rows, 10);
    const header = `**Query #${id}** — ${result.rows.length} row(s)\n\n`;
    const fullMessage = header + '```\n' + table + '\n```';

    const chunks = splitIntoChunks(fullMessage, MAX_MESSAGE_LENGTH);

    const first = chunks[0];
    if (first !== undefined) {
      await interaction.editReply(first);
    }

    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk !== undefined) {
        await interaction.followUp(chunk);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await interaction.editReply(`❌ Error: ${message}`);
  }
}
