import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { GetSubscribedTickersUseCase } from '@/application/use-cases/ticker';
import { ITickerRepository } from '@/domain/repositories/ticker.repository';
import { IEventBus } from '@/shared/event-bus';

export const data = new SlashCommandBuilder()
  .setName('market-summary')
  .setDescription('Analyze market data and sentiment for watched tickers')
  .addBooleanOption((option) =>
    option
      .setName('all')
      .setDescription('Analyze all subscribed tickers (default: yes)')
  )
  .addStringOption((option) =>
    option
      .setName('ticker')
      .setDescription('Analyze a specific ticker (e.g., BBCA.JK)')
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  tickerRepository: ITickerRepository,
  eventBus: IEventBus
): Promise<void> {
  await interaction.deferReply();

  try {
    const specificTicker = interaction.options.getString('ticker');
    let tickersToAnalyze: string[] = [];

    if (specificTicker) {
      tickersToAnalyze = [specificTicker.toUpperCase()];
    } else {
      // Get all subscribed tickers
      const getTickersUseCase = new GetSubscribedTickersUseCase(tickerRepository);
      const tickers = await getTickersUseCase.execute();

      if (tickers.length === 0) {
        await interaction.editReply(
          '📊 No tickers in the watchlist. Use `/add-ticker` to add some!'
        );
        return;
      }

      tickersToAnalyze = tickers.map((t) => t.symbol);
    }

    // Emit market analysis trigger event
    await eventBus.publish({
      type: 'worker:market-analysis:trigger',
      source: 'bot',
      timestamp: new Date(),
    });

    await interaction.editReply({
      content: `⏳ Analyzing ${tickersToAnalyze.length} ticker(s)... Results will be posted shortly.`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to trigger market analysis';
    await interaction.editReply({
      content: `❌ ${message}`,
    });
  }
}
