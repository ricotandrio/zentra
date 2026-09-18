import { MarketAnalysis, MarketDataPort } from '../contracts';

export class AnalyzeTickersUseCase {
  constructor(private readonly marketData: MarketDataPort) {}

  async execute(symbols: string[]): Promise<MarketAnalysis[]> {
    if (symbols.length === 0) {
      throw new Error('No tickers provided');
    }

    if (symbols.length > 10) {
      throw new Error('Cannot analyze more than 10 tickers at once');
    }

    try {
      return await this.marketData.analyzeMultipleTickers(symbols);
    } catch (error) {
      // eslint-disable-next-line preserve-caught-error
      throw new Error(
        `Failed to analyze tickers: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
