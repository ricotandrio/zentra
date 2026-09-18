import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { IEventBus } from '@/shared/event-bus';
import { TickerManagementModule } from '@/modules/ticker-management';

export const data = new SlashCommandBuilder()
  .setName('list-tickers')
  .setDescription('Show all subscribed tickers in the watchlist');

export async function execute(
  interaction: ChatInputCommandInteraction,
  eventBus?: IEventBus,
  tickerManagementModule?: TickerManagementModule
): Promise<void> {
  try {
    const tickers = await tickerManagementModule?.getTickersUseCase.execute();

    if (!tickers || tickers.length === 0) {
      await interaction.reply(
        '📊 No tickers in the watchlist yet. Use `/add-ticker` to add one!'
      );
      return;
    }

    const tickerList = tickers
      .map((t, i) => `${i + 1}. **${t.symbol}**`)
      .join('\n');

    await interaction.reply(`📊 **Watched Tickers** (${tickers.length}):\n\n${tickerList}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch tickers';
    await interaction.reply({
      content: `❌ ${message}`,
      ephemeral: true,
    });
  }
}
