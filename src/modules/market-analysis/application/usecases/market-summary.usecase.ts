import { MarketSummary, MarketSummaryPort } from '../contracts';

/**
 * Market Summary Use Case
 * Fetches market data from market data source and generates market summary with top/bottom performers
 */
export class MarketSummaryUseCase {
  constructor(private readonly marketSummary: MarketSummaryPort) {}

  async execute(): Promise<MarketSummary> {
    return this.marketSummary.getMarketSummary();
  }
}
