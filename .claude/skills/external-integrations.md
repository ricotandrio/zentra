# External Integrations Skill

> **How to safely integrate third-party services (GitHub, Yahoo Finance, LLMs, etc.)**

## The Adapter Pattern

All external services must follow the adapter pattern:

```
Application (Use Case)
    ↓ (depends on)
Contract/Port (IMarketDataAdapter)
    ↑ (implements)
Infrastructure Adapter (YahooAdapter)
    ↑ (calls)
External Service (Yahoo Finance API)
```

## Step 1: Define the Contract

In `src/application/contracts/`:

```typescript
// src/application/contracts/market-data.contract.ts
export interface IMarketDataAdapter {
  getQuote(symbol: string): Promise<{
    price: number;
    changePercent: number;
    volume: number;
  }>;
  getNews(symbol: string): Promise<NewsItem[]>;
}
```

**Key**: Define the contract from the use case's perspective, not the API's.

## Step 2: Implement the Adapter

In `src/infrastructure/external/<service>/`:

```typescript
// src/infrastructure/external/yahoo/yahoo.adapter.ts
import yahooFinance from 'yahoo-finance2';
import { IMarketDataAdapter } from '@/application/contracts';

export class YahooAdapter implements IMarketDataAdapter {
  async getQuote(symbol: string) {
    const quote = await yahooFinance.quote(symbol);
    return {
      price: quote.regularMarketPrice,
      changePercent: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
    };
  }

  async getNews(symbol: string): Promise<NewsItem[]> {
    const news = await yahooFinance.news({ symbols: [symbol] });
    return news.map((item) => ({
      title: item.title,
      link: item.link,
    }));
  }
}
```

**Key**: Translate external API response to your domain model. Hide all SDK details.

## Step 3: Use in Application Layer

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

## Step 4: Wire in Bootstrap

In `src/bootstrap/main.api.ts` or `main.worker.ts`:

```typescript
import { YahooAdapter } from '@/infrastructure/external/yahoo';
import { AnalyzeMarketUseCase } from '@/application/use-cases/ticker';

const marketDataAdapter = new YahooAdapter();
const analyzeMarketUseCase = new AnalyzeMarketUseCase(marketDataAdapter);

// Now use analyzeMarketUseCase
```

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

## Swapping Implementations

Later, replace Yahoo with another provider:

```typescript
// Old:
const adapter = new YahooAdapter();

// New:
const adapter = new AlphaVantageAdapter(); // Same IMarketDataAdapter

// Everything else works unchanged
```

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

## Current Adapters

- **Yahoo Finance** (`infrastructure/external/yahoo/`) — Market data & news
- **GitHub** (`infrastructure/external/github/`) — Issue creation & PR notifications
- **LLM** (`infrastructure/external/llm/`) — Gemini (swappable for OpenAI, Claude, etc.)

## Adding a New External Service

1. Define contract in `src/application/contracts/<service>.contract.ts`
2. Implement adapter in `src/infrastructure/external/<service>/<service>.adapter.ts`
3. Inject contract into use case
4. Wire in bootstrap

## Design Principles

✅ **Depend on contracts, not implementations** — Allows swapping.  
✅ **One adapter per external service** — Keep concerns separated.  
✅ **Map external errors to domain errors** — Hide third-party specifics.  
✅ **No business logic in adapters** — Only translation and I/O.  
✅ **Test adapters separately** — Mock the SDK, verify translation.

❌ **Never call external SDK from use cases** — Breaks the architecture.  
❌ **Don't create adapters for stable libraries** — Only for external services (GitHub, APIs, etc.).  
❌ **Don't mix protocols in one adapter** — HTTP adapter ≠ WebSocket adapter.
