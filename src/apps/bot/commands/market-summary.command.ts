import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { IEventBus } from '@/shared/event-bus';
import { TickerManagementModule } from '@/modules/ticker-management';
import { generateShortTraceId } from '@/shared/utils';

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
  eventBus: IEventBus,
  tickerManagementModule: TickerManagementModule
): Promise<void> {
  await interaction.deferReply();

  try {
    const specificTicker = interaction.options.getString('ticker');
    let tickersToAnalyze: string[] = [];

    if (specificTicker) {
      tickersToAnalyze = [specificTicker.toUpperCase()];
    } else {
      const tickers = await tickerManagementModule.getTickersUseCase.execute();

      if (tickers.length === 0) {
        await interaction.editReply(
          '📊 No tickers in the watchlist. Use `/add-ticker` to add some!'
        );
        return;
      }

      tickersToAnalyze = tickers.map((t) => t.symbol);
    }

    // Emit market analysis trigger event
    const traceId = generateShortTraceId();
    eventBus.publish({
      type: 'worker:market-analysis:trigger',
      source: 'bot',
      timestamp: new Date(),
      traceId,
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
