---
name: clean-architecture
description: Understand Zentra's clean architecture layers and dependency flow (inward only). Use when confused about dependencies, architecture violations, or to learn layer invariants and anti-patterns.
user-invocable: true
disable-model-invocation: false
---

# Clean Architecture Pattern

Core architectural principle for all Zentra code. **Golden Rule**: Dependencies flow **inward only**. Domain has zero external dependencies.

## Quick Reference: Dependency Flow

```
Interfaces (Discord, API, Worker) ← Entry points
       ↓
   Application (Use Cases) ← Business orchestration
       ↓
      Domain (Entities, Services) ← Pure business logic
       ↑
Infrastructure (APIs, DB, Adapters) ← Implementation details
```

## Layer Import Rules

| Layer | ✅ Can Import | ❌ Cannot Import |
|-------|--------------|-----------------|
| **Domain** | `domain/`, `shared/` | Everything else |
| **Application** | `domain/`, `shared/`, `application/` | `infrastructure/`, `interfaces/` |
| **Infrastructure** | All except `interfaces/` | `interfaces/` |
| **Interfaces** | Everything | Nothing |
| **Shared** | `shared/` only | `domain/`, `application/`, `infrastructure/`, `interfaces/` |

## Layer Breakdown with Examples

### Domain Layer (Pure Logic)
```typescript
// ✅ DO: Business entities and services
export class Ticker {
  constructor(readonly symbol: string, readonly name: string) {}
  
  isValid(): boolean {
    return this.symbol.length > 0 && /^[A-Z]+$/.test(this.symbol);
  }
}

export class MarketAnalysisService {
  analyze(price: number, previousPrice: number): 'bullish' | 'bearish' {
    return price > previousPrice ? 'bullish' : 'bearish';
  }
}

// ❌ DON'T: External dependencies
import { yahooClient } from '@/infrastructure'; // Wrong!
```

### Application Layer (Use Cases)
```typescript
// ✅ DO: Orchestrate using ports, not implementations
export class AnalyzeMarketUseCase {
  constructor(
    private marketDataPort: IMarketDataPort,  // Interface!
    private tickerRepository: ITickerRepository,  // Interface!
    private eventBus: IEventBus
  ) {}

  async execute(symbols: string[]): Promise<AnalysisResult[]> {
    const tickers = await this.tickerRepository.findBySymbols(symbols);
    const results = await Promise.all(
      tickers.map(ticker => this.marketDataPort.analyze(ticker))
    );
    await this.eventBus.publish({
      type: 'analysis:complete',
      data: results
    });
    return results;
  }
}

// ❌ DON'T: Import concrete implementations
import { YahooAdapter } from '@/infrastructure'; // Wrong!
```

### Infrastructure Layer (Adapters)
```typescript
// ✅ DO: Implement ports from application
export class YahooMarketDataAdapter implements IMarketDataPort {
  async analyze(ticker: Ticker): Promise<AnalysisResult> {
    const quote = await this.yahooClient.getQuote(ticker.symbol);
    return { symbol: ticker.symbol, price: quote.price };
  }
}

// Infrastructure can use external packages
import Yahoo from 'yahoo-finance2';
```

### Interfaces Layer (Entry Points)
```typescript
// ✅ DO: Receive dependencies, trigger use cases
@Controller('/analyze')
export class AnalyzeController {
  constructor(private analyzeMarketUseCase: AnalyzeMarketUseCase) {}

  @Post()
  async handle(@Body() dto: AnalyzeDto) {
    return this.analyzeMarketUseCase.execute(dto.symbols);
  }
}
```

## Common Anti-Patterns & Fixes

### ❌ Anti-Pattern: Calling APIs directly in Use Case
```typescript
// WRONG
export class AnalyzeMarketUseCase {
  async execute(symbol: string) {
    const price = await fetch(`https://api.yahoo.com/quote/${symbol}`); // Direct call!
    return { symbol, price };
  }
}
```

### ✅ Fix: Use a Port/Adapter
```typescript
// Create port in application
export interface IMarketDataPort {
  getQuote(symbol: string): Promise<Quote>;
}

// Use case depends on port (abstraction)
export class AnalyzeMarketUseCase {
  constructor(private marketDataPort: IMarketDataPort) {}

  async execute(symbol: string) {
    const price = await this.marketDataPort.getQuote(symbol); // Port!
    return { symbol, price };
  }
}

// Implement adapter in infrastructure
export class YahooMarketDataAdapter implements IMarketDataPort {
  async getQuote(symbol: string): Promise<Quote> {
    return fetch(`https://api.yahoo.com/quote/${symbol}`);
  }
}
```

## Refactoring Checklist

Use this when reviewing or refactoring code:

- [ ] Domain has zero imports from `infrastructure/`, `interfaces/`, `application/`
- [ ] Application imports only from `domain/`, `shared/`, and `application/`
- [ ] Application never imports concrete implementations (only interfaces)
- [ ] Interfaces/handlers trigger use cases, don't contain business logic
- [ ] Ports are defined in `application/contracts/`
- [ ] Adapters are in `infrastructure/` and implement application ports
- [ ] No circular dependencies (use `eslint-plugin-import` to verify)
- [ ] Business logic lives in domain or use cases, not handlers
- [ ] Event bus is injected, not global
- [ ] Configuration is injected at bootstrap, not imported directly

## Testing Strategy

```typescript
// ✅ Domain: Zero dependencies needed
describe('Ticker', () => {
  it('validates symbol', () => {
    const ticker = new Ticker('AAPL', 'Apple');
    expect(ticker.isValid()).toBe(true);
  });
});

// ✅ Application: Mock ports
describe('AnalyzeMarketUseCase', () => {
  it('publishes event on success', async () => {
    const mockPort = { getQuote: jest.fn().mockResolvedValue({ price: 100 }) };
    const mockBus = { publish: jest.fn() };
    const useCase = new AnalyzeMarketUseCase(mockPort, mockBus);
    
    await useCase.execute('AAPL');
    expect(mockBus.publish).toHaveBeenCalledWith(expect.objectContaining({
      type: 'analysis:complete'
    }));
  });
});

// ✅ Infrastructure: Integration tests
describe('YahooMarketDataAdapter', () => {
  it('fetches real quote', async () => {
    const adapter = new YahooMarketDataAdapter();
    const quote = await adapter.getQuote('AAPL');
    expect(quote.price).toBeGreaterThan(0);
  });
});
```

## Learn More

- [reference.md](reference.md) — Complete layer invariants and detailed rules
- [anti-patterns.md](anti-patterns.md) — Common violations and fixes
