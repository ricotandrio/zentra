import { MarketScraperAdapter } from '@/modules/market-analysis/infrastructure/data-sources';
import { MarketSummary } from '@/modules/market-analysis/infrastructure/data-sources';

/**
 * Market Summary Use Case
 * Fetches market data from market data source and generates market summary with top/bottom performers
 */
export class MarketSummaryUseCase {
  constructor() {}

  async execute(): Promise<MarketSummary> {
    const marketScraperAdapter = new MarketScraperAdapter();
    await marketScraperAdapter.initialize();
    const summary = await marketScraperAdapter.getMarketSummary();
    await marketScraperAdapter.close();
    return summary;
  }
}
