import { EmbedBuilder } from 'discord.js';
import { MarketSummary } from '@/modules/market-analysis/infrastructure/data-sources';

/**
 * Market Summary Discord Result Use Case
 * Formats market summary data for Discord delivery with top/bottom performers
 */
export class MarketSummaryDiscordResultUseCase {
  formatMarketSummaryAsEmbed(summary: MarketSummary): EmbedBuilder {
    const MAX_ENTRIES = 5;

    const topVolumeList = summary.topVolume
      .slice(0, MAX_ENTRIES)
      .map((t) => `${t.stockCode}: ${t.volume.toLocaleString('id-ID')}`)
      .join('\n');

    const topValueList = summary.topValue
      .slice(0, MAX_ENTRIES)
      .map((t) => `${t.stockCode}: Rp${t.value.toLocaleString('id-ID')}`)
      .join('\n');

    const topFrequencyList = summary.topFrequency
      .slice(0, MAX_ENTRIES)
      .map((t) => `${t.stockCode}: ${t.frequency} trades`)
      .join('\n');

    const foreignBuyList = summary.foreignTopBuy
      .slice(0, MAX_ENTRIES)
      .map((t) => `${t.stockCode}: ${t.foreignBuy.toLocaleString('id-ID')} shares`)
      .join('\n');

    const foreignSellList = summary.foreignTopSell
      .slice(0, MAX_ENTRIES)
      .map((t) => `${t.stockCode}: ${t.foreignSell.toLocaleString('id-ID')} shares`)
      .join('\n');

    return new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('📊 IDX Market Summary')
      .setDescription(`Market Overview - ${summary.date}`)
      .addFields(
        {
          name: '📈 Market Statistics',
          value: `Total Tickers: **${summary.totalTickers}**\nTotal Volume: **${summary.totalVolume.toLocaleString('id-ID')}**\nTotal Value: **Rp${summary.totalValue.toLocaleString('id-ID')}**\nAvg Change: **${summary.averageChangePercent.toFixed(2)}%**`,
          inline: false,
        },
        {
          name: '🔥 Top Volume',
          value: topVolumeList || 'No data',
          inline: true,
        },
        {
          name: '💰 Top Value',
          value: topValueList || 'No data',
          inline: true,
        },
        {
          name: '⚡ Top Frequency',
          value: topFrequencyList || 'No data',
          inline: true,
        },
        {
          name: '🇮🇩 Foreign Top Buy',
          value: foreignBuyList || 'No data',
          inline: true,
        },
        {
          name: '🇮🇩 Foreign Top Sell',
          value: foreignSellList || 'No data',
          inline: true,
        }
      )
      .setFooter({
        text: `Generated at: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
      });
  }

  execute(summary: MarketSummary): {
    embeds: EmbedBuilder[];
    title: string;
  } {
    const embed = this.formatMarketSummaryAsEmbed(summary);

    return {
      embeds: [embed],
      title: 'IDX Market Summary',
    };
  }
}
