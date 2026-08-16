import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ContentSummaryModule } from '@/modules/content-summary';

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
  _eventBus?: unknown,
  _tickerManagementModule?: unknown,
  contentSummaryModule?: ContentSummaryModule
): Promise<void> {
  const url = interaction.options.getString('url', true);

  await interaction.deferReply();

  try {
    if (!contentSummaryModule) {
      await interaction.editReply('❌ Content summary module is not available.');
      return;
    }

    const { summary } = await contentSummaryModule.summarize.execute(url);

    const content = `TLDR: ${url}\n\n${summary}`;
    const chunks = splitIntoChunks(content, MAX_MESSAGE_LENGTH);
    const [firstChunk, ...restChunks] = chunks;

    if (firstChunk) {
      await interaction.editReply(firstChunk);
    }

    for (const chunk of restChunks) {
      await interaction.followUp(chunk);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to summarize content';
    await interaction.editReply(`❌ ${message}`);
  }
}
