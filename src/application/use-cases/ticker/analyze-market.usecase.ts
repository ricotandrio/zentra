import { MarketAnalysis } from '@/infrastructure/external/yahoo/yahoo.types';
import {
  analyzeMarket,
  analyzeMultipleTickers,
} from '@/infrastructure/external/yahoo/yahoo.adapter';

/**
 * Analyze Market Use Case
 * Analyzes market data and sentiment for tickers
 */
export class AnalyzeMarketUseCase {
  async analyzeSingleTicker(symbol: string): Promise<MarketAnalysis> {
    try {
      return await analyzeMarket(symbol);
    } catch (error) {
      throw new Error(
        `Failed to analyze ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { cause: error }
      );
    }
  }

  async analyzeMultipleTickers(symbols: string[]): Promise<MarketAnalysis[]> {
    if (symbols.length === 0) {
      throw new Error('No tickers provided');
    }

    if (symbols.length > 10) {
      throw new Error('Cannot analyze more than 10 tickers at once');
    }

    try {
      return await analyzeMultipleTickers(symbols);
    } catch (error) {
      throw new Error(
        `Failed to analyze tickers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { cause: error }
      );
    }
  }
}
