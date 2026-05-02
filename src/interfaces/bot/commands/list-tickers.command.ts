import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { GetSubscribedTickersUseCase } from '@/application/use-cases/ticker';
import { ITickerRepository } from '@/domain/repositories/ticker.repository';
import { IEventBus } from '@/shared/event-bus';

export const data = new SlashCommandBuilder()
  .setName('list-tickers')
  .setDescription('Show all subscribed tickers in the watchlist');

export async function execute(
  interaction: ChatInputCommandInteraction,
  tickerRepository: ITickerRepository,
  _eventBus?: IEventBus
): Promise<void> {
  try {
    const useCase = new GetSubscribedTickersUseCase(tickerRepository);
    const tickers = await useCase.execute();

    if (tickers.length === 0) {
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
