---
name: external-adapter-pattern
description: How to safely integrate third-party services (GitHub, Yahoo Finance, LLMs, APIs) using the adapter pattern. Use when adding external integrations, need to swap implementations, or mapping errors. Examples from Playwright scraping, Yahoo Finance, Gemini LLM.
user-invocable: true
disable-model-invocation: false
---

# External Integrations & Adapter Pattern

How to safely integrate third-party services in Zentra's modular architecture.

## The Adapter Pattern

All external services must follow the adapter pattern:

```
Application Use Case
    ↓ (depends on)
Contract/Port (Interface)
    ↑ (implements)
Infrastructure Adapter (Concrete class)
    ↑ (calls)
External Service (API, SDK, Browser, etc.)
```

## Step 1: Define the Contract (Optional)

For domain contracts, use `src/application/contracts/`:

```typescript
// src/application/contracts/market-data.contract.ts
export interface IMarketDataAdapter {
  getQuote(symbol: string): Promise<{
    price: number;
    changePercent: number;
    volume: number;
  }>;
}
```

For data-source adapters within modules, skip the explicit contract and use the adapter class directly:

```typescript
// src/modules/market-analysis/infrastructure/data-sources/market-scraper.adapter.ts
export class MarketScraperAdapter {
  async getTradingSummary(): Promise<MarketTickerData[]> { }
  async getMarketSummary(): Promise<MarketSummary> { }
}
```

**Key**: Define the contract from the use case's perspective, not the API's.

---

## Step 2: Define Data Transfer Types

For external data sources, define DTO/response types in `*.types.ts`:

```typescript
// src/modules/market-analysis/infrastructure/data-sources/market-scraper.types.ts
export interface MarketTickerData {
  stockCode: string;
  stockName: string;
  close: number;
  volume: number;
  foreignBuy: number;
  foreignSell: number;
  // ... 25+ fields
}

export interface MarketSummary {
  topVolume: MarketTickerData[];
  topValue: MarketTickerData[];
  foreignTopNetBuy: MarketTickerData[];
  foreignTopNetSell: MarketTickerData[];
  totalTickers: number;
  totalVolume: number;
  averageChangePercent: number;
  date: string;
}

export interface MarketApiResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: MarketTickerData[];
}
```

---

## Step 3: Implement the Adapter

In `src/modules/<feature>/infrastructure/data-sources/`:

```typescript
// src/modules/market-analysis/infrastructure/data-sources/market-scraper.adapter.ts
import { chromium, Browser, Page } from 'playwright';
import { logger } from '@/shared/logger';
import { MarketTickerData, MarketSummary, MarketApiResponse } from './market-scraper.types';

export class MarketScraperAdapter {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    logger.info('Playwright browser initialized');
  }

  async getRawTradingSummary(): Promise<MarketTickerData[]> {
    if (!this.page) throw new Error('Adapter not initialized');
    
    await this.page.goto(MARKET_DATA_URL, { waitUntil: 'domcontentloaded' });
    const jsonText = await this.page.textContent('pre');
    if (!jsonText) throw new Error('No JSON data found');
    
    const response: MarketApiResponse = JSON.parse(jsonText);
    this.validateResponse(response);
    return response.data;
  }

  async getTradingSummary(): Promise<MarketTickerData[]> {
    const raw = await this.getRawTradingSummary();
    return raw.map(ticker => this.mapToMarketTickerData(ticker));
  }

  async getMarketSummary(): Promise<MarketSummary> {
    const tickers = await this.getTradingSummary();
    
    const topVolume = [...tickers].sort((a, b) => b.volume - a.volume).slice(0, 10);
    const foreignTopNetBuy = [...tickers]
      .sort((a, b) => (b.foreignBuy - b.foreignSell) - (a.foreignBuy - a.foreignSell))
      .slice(0, 10);
    
    return {
      topVolume,
      topValue: [...tickers].sort((a, b) => b.value - a.value).slice(0, 10),
      foreignTopNetBuy,
      foreignTopNetSell: [...tickers]
        .sort((a, b) => (b.foreignSell - b.foreignBuy) - (a.foreignSell - a.foreignBuy))
        .slice(0, 10),
      totalTickers: tickers.length,
      totalVolume: tickers.reduce((sum, t) => sum + t.volume, 0),
      averageChangePercent: tickers.reduce((sum, t) => sum + t.change, 0) / tickers.length,
      date: isoDateToLocaleString(tickers[0].date),
    };
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      logger.info('Browser closed');
    }
  }

  private validateResponse(response: unknown): asserts response is MarketApiResponse {
    if (!response || typeof response !== 'object') throw new Error('Invalid API response');
    if (!('data' in response) || !Array.isArray(response.data)) throw new Error('Missing data array');
  }

  private mapToMarketTickerData(raw: any): MarketTickerData {
    return {
      stockCode: raw.StockCode,
      stockName: raw.StockName,
      close: raw.Close,
      volume: raw.Volume,
      foreignBuy: raw.ForeignBuy,
      foreignSell: raw.ForeignSell,
      // Map remaining 24+ fields
    };
  }
}
```

**Key principles:**
- ✅ All external SDK calls wrapped in adapter methods
- ✅ Data validation before returning
- ✅ DTO types separate from domain entities
- ✅ Error handling per SDK (throw descriptive errors)
- ✅ Resource cleanup (browser close, connections, etc.)

---

## Step 4: Use in Application Layer

The use case depends on the contract, not the implementation:

```typescript
// src/application/use-cases/ticker/analyze-market.usecase.ts
export class AnalyzeMarketUseCase {
  constructor(
    private marketDataAdapter: IMarketDataAdapter, // Contract, not implementation!
  ) {}

  async execute(symbols: string[]) {
    const quotes = await Promise.all(
      symbols.map((symbol) => this.marketDataAdapter.getQuote(symbol))
    );
    return quotes;
  }
}
```

---

## Step 4: Wire in Bootstrap

In `src/bootstrap/main.api.ts` or `main.worker.ts`:

```typescript
import { YahooAdapter } from '@/infrastructure/external/yahoo';
import { AnalyzeMarketUseCase } from '@/application/use-cases/ticker';

const marketDataAdapter = new YahooAdapter();
const analyzeMarketUseCase = new AnalyzeMarketUseCase(marketDataAdapter);

// Now use analyzeMarketUseCase
```

---

## Error Handling

Map external errors to domain errors in the adapter:

```typescript
export class YahooAdapter implements IMarketDataAdapter {
  async getQuote(symbol: string) {
    try {
      const quote = await yahooFinance.quote(symbol);
      return {
        price: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
      };
    } catch (error) {
      if (error.message.includes('No data found')) {
        throw new TickerNotFoundError(`Ticker ${symbol} not found`);
      }
      throw new MarketDataError(`Failed to fetch market data: ${error.message}`);
    }
  }
}
```

---

## Swapping Implementations

Later, replace Yahoo with another provider:

```typescript
// Old:
const adapter = new YahooAdapter();

// New:
const adapter = new AlphaVantageAdapter(); // Same IMarketDataAdapter

// Everything else works unchanged
```

---

## Testing with Adapters

Unit test the adapter with mocked SDK:

```typescript
jest.mock('yahoo-finance2');

describe('YahooAdapter', () => {
  it('should map Yahoo response to domain model', async () => {
    yahooFinance.quote.mockResolvedValue({
      regularMarketPrice: 150,
      regularMarketChangePercent: 2.5,
      regularMarketVolume: 1000000,
    });

    const adapter = new YahooAdapter();
    const result = await adapter.getQuote('AAPL');

    expect(result).toEqual({
      price: 150,
      changePercent: 2.5,
      volume: 1000000,
    });
  });
});
```

---

## Current Adapters

- **Yahoo Finance** (`infrastructure/external/yahoo/`) — Market data & news
- **GitHub** (`infrastructure/external/github/`) — Issue creation & PR notifications
- **LLM** (`infrastructure/external/llm/`) — Gemini (swappable for OpenAI, Claude, etc.)

---

## Adding a New External Service

1. Define contract in `src/application/contracts/<service>.contract.ts`
2. Implement adapter in `src/infrastructure/external/<service>/<service>.adapter.ts`
3. Inject contract into use case
4. Wire in bootstrap

See [examples.md](examples.md) for full examples.

---

## Design Principles

✅ **Depend on contracts, not implementations** — Allows swapping  
✅ **One adapter per external service** — Keep concerns separated  
✅ **Map external errors to domain errors** — Hide third-party specifics  
✅ **No business logic in adapters** — Only translation and I/O  
✅ **Test adapters separately** — Mock the SDK, verify translation  

❌ **Never call external SDK from use cases** — Breaks the architecture  
❌ **Don't create adapters for stable libraries** — Only for external services  
❌ **Don't mix protocols in one adapter** — HTTP adapter ≠ WebSocket adapter  

---

## See Also

See [reference.md](reference.md) for adapter implementation checklist.  
See [templates/](templates/) for adapter templates.  
See [external-adapter-pattern skill](/skills/external-adapter-pattern/SKILL.md) examples.
