import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { AnalyzeMarketUseCase, GetSubscribedTickersUseCase } from '@/application/use-cases/ticker';
import { ITickerRepository } from '@/domain/repositories/ticker.repository';

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
  tickerRepository: ITickerRepository
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

    const analyzeUseCase = new AnalyzeMarketUseCase();
    const analyses = await analyzeUseCase.analyzeMultipleTickers(tickersToAnalyze);

    // Create embeds for each ticker
    const embeds = analyses.map((analysis) => {
      const sentimentEmoji =
        analysis.overallSentiment.label === 'bullish'
          ? '🟢'
          : analysis.overallSentiment.label === 'bearish'
            ? '🔴'
            : '🟡';

      const priceChange = analysis.quote.change >= 0 ? '📈' : '📉';
      const changeStr = `${analysis.quote.changePercent >= 0 ? '+' : ''}${analysis.quote.changePercent.toFixed(2)}%`;

      return new EmbedBuilder()
        .setColor(
          analysis.overallSentiment.label === 'bullish'
            ? 0x00ff00
            : analysis.overallSentiment.label === 'bearish'
              ? 0xff0000
              : 0xffff00
        )
        .setTitle(`${sentimentEmoji} ${analysis.quote.ticker} — ${analysis.quote.name}`)
        .addFields(
          {
            name: `${priceChange} Price`,
            value: `Rp${analysis.quote.price.toLocaleString('id-ID')} (${changeStr})`,
            inline: true,
          },
          {
            name: '📊 Volume',
            value: analysis.quote.volume.toLocaleString('id-ID'),
            inline: true,
          },
          {
            name: '📈 52w High',
            value: `Rp${analysis.quote.fiftyTwoWeekHigh.toLocaleString('id-ID')}`,
            inline: true,
          },
          {
            name: '📉 52w Low',
            value: `Rp${analysis.quote.fiftyTwoWeekLow.toLocaleString('id-ID')}`,
            inline: true,
          },
          {
            name: `${sentimentEmoji} Sentiment`,
            value: `**${analysis.overallSentiment.label.toUpperCase()}** (${analysis.overallSentiment.score})`,
            inline: false,
          },
          {
            name: '🎯 Top Signals',
            value:
              analysis.overallSentiment.signals.length > 0
                ? analysis.overallSentiment.signals.join(' ')
                : 'No strong signals',
            inline: false,
          },
          {
            name: '📰 News Sentiment',
            value: `Based on ${analysis.news.length} recent articles`,
            inline: false,
          }
        )
        .setFooter({
          text: `Last updated: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
        });
    });

    // Split embeds into chunks if more than 10 (Discord limit is 10 per message)
    const chunks: EmbedBuilder[][] = [];
    for (let i = 0; i < embeds.length; i += 10) {
      chunks.push(embeds.slice(i, i + 10));
    }

    // Send first chunk in the reply
    await interaction.editReply({
      embeds: chunks[0],
    });

    // Send remaining chunks as follow-ups
    for (let i = 1; i < chunks.length; i++) {
      await interaction.followUp({
        embeds: chunks[i],
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to analyze market';
    await interaction.editReply({
      content: `❌ ${message}`,
    });
  }
}
