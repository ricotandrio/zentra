import { EmbedBuilder } from 'discord.js';
import { WorkerWebhookPayload, MarketAnalysisResultDTO } from '@/modules/market-analysis/contracts/market-results.dto';

/**
 * Process Market Analysis Results Use Case
 * Validates webhook payload from worker and formats for Discord delivery
 */
export class ProcessMarketAnalysisResultsUseCase {
  validate(payload: unknown): payload is WorkerWebhookPayload {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload: not an object');
    }

    const p = payload as Record<string, unknown>;

    if (p.source !== 'market-analysis-job') {
      throw new Error('Invalid source: expected market-analysis-job');
    }

    if (!Array.isArray(p.results)) {
      throw new Error('Invalid results: not an array');
    }

    if (p.results.length === 0) {
      throw new Error('No market analysis results provided');
    }

    if (typeof p.channelId !== 'string' || !p.channelId) {
      throw new Error('Invalid channelId: must be a non-empty string');
    }

    return true;
  }

  formatResultsAsEmbeds(results: MarketAnalysisResultDTO[]): EmbedBuilder[] {
    return results.map((analysis) => {
      const sentimentEmoji =
        analysis.sentiment.label === 'bullish'
          ? '🟢'
          : analysis.sentiment.label === 'bearish'
            ? '🔴'
            : '🟡';

      const priceChange = analysis.changePercent >= 0 ? '📈' : '📉';
      const changeStr = `${analysis.changePercent >= 0 ? '+' : ''}${analysis.changePercent.toFixed(2)}%`;

      return new EmbedBuilder()
        .setColor(
          analysis.sentiment.label === 'bullish'
            ? 0x00ff00
            : analysis.sentiment.label === 'bearish'
              ? 0xff0000
              : 0xffff00
        )
        .setTitle(`${sentimentEmoji} ${analysis.ticker}`)
        .addFields(
          {
            name: `${priceChange} Price`,
            value: `Rp${analysis.price.toLocaleString('id-ID')} (${changeStr})`,
            inline: true,
          },
          {
            name: '📊 Volume',
            value: analysis.volume.toLocaleString('id-ID'),
            inline: true,
          },
          {
            name: '📈 52w High',
            value: `Rp${analysis.fiftyTwoWeekHigh.toLocaleString('id-ID')}`,
            inline: true,
          },
          {
            name: '📉 52w Low',
            value: `Rp${analysis.fiftyTwoWeekLow.toLocaleString('id-ID')}`,
            inline: true,
          },
          {
            name: `${sentimentEmoji} Sentiment`,
            value: `**${analysis.sentiment.label.toUpperCase()}** (${analysis.sentiment.score})`,
            inline: false,
          },
          {
            name: '🎯 Top Signals',
            value:
              analysis.sentiment.signals.length > 0
                ? analysis.sentiment.signals.join(' ')
                : 'No strong signals',
            inline: false,
          },
          {
            name: '📰 News Articles',
            value: `${analysis.newsCount} recent articles analyzed`,
            inline: false,
          }
        )
        .setFooter({
          text: `Last updated: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
        });
    });
  }

  execute(payload: WorkerWebhookPayload): {
    embeds: EmbedBuilder[];
    channelId: string;
  } {
    this.validate(payload);

    const embeds = this.formatResultsAsEmbeds(payload.results);

    return {
      embeds,
      channelId: payload.channelId,
    };
  }
}
