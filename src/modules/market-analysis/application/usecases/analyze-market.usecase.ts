import { MarketAnalysis } from '@/modules/market-analysis/infrastructure/yahoo/yahoo.types';
import {
  analyzeMultipleTickers,
} from '@/modules/market-analysis/infrastructure/yahoo/yahoo.adapter';

export class AnalyzeMarketUseCase {
  async execute(symbols: string[]): Promise<MarketAnalysis[]> {
    if (symbols.length === 0) {
      throw new Error('No tickers provided');
    }

    if (symbols.length > 10) {
      throw new Error('Cannot analyze more than 10 tickers at once');
    }

    try {
      return await analyzeMultipleTickers(symbols);
    } catch (error) {
      // eslint-disable-next-line preserve-caught-error
      throw new Error(`Failed to analyze tickers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
