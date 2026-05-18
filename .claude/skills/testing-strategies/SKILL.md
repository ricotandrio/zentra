---
name: testing-strategies
description: How to write tests for Zentra's architecture: unit tests for domain/application/infrastructure, integration tests for interfaces, mocking patterns, and coverage goals.
user-invocable: true
disable-model-invocation: false
---

# Testing Strategies

How to write tests that fit Zentra's architecture.

## Test Organization

```
tests/
├── unit/
│   ├── application/
│   │   ├── use-cases/
│   │   └── orchestrators/
│   ├── domain/
│   │   ├── entities/
│   │   ├── services/
│   │   └── value-objects/
│   └── interfaces/
│       ├── api/
│       ├── bot/
│       └── worker/
└── integration/
    ├── infrastructure/
    │   └── external/
    └── interfaces/
        ├── api/
        ├── bot/
        └── worker/
```

---

## Unit Testing Strategy

### Domain Tests (Pure Logic)

No mocks needed. Domain is framework-free:

```typescript
describe('Ticker Entity', () => {
  it('should create with valid symbol and name', () => {
    const ticker = TickerEntity.create('AAPL', 'Apple');
    expect(ticker.symbol).toBe('AAPL');
    expect(ticker.name).toBe('Apple');
  });

  it('should prevent invalid symbols', () => {
    expect(() => {
      TickerEntity.create('INVALID_SYMBOL', 'Bad');
    }).toThrow(InvalidTickerError);
  });
});
```

---

### Application Tests (Use Cases)

Mock only the dependencies (ports/contracts):

```typescript
describe('AnalyzeMarketUseCase', () => {
  let useCase: AnalyzeMarketUseCase;
  let mockYahooAdapter: jest.Mocked<IMarketDataAdapter>;

  beforeEach(() => {
    mockYahooAdapter = {
      getQuote: jest.fn().mockResolvedValue({ price: 150 }),
    } as any;
    useCase = new AnalyzeMarketUseCase(mockYahooAdapter);
  });

  it('should analyze market data', async () => {
    const result = await useCase.execute(['AAPL']);
    expect(mockYahooAdapter.getQuote).toHaveBeenCalledWith('AAPL');
    expect(result).toHaveLength(1);
  });

  it('should handle adapter errors', async () => {
    mockYahooAdapter.getQuote.mockRejectedValue(
      new TickerNotFoundError('AAPL not found')
    );

    await expect(useCase.execute(['AAPL'])).rejects.toThrow(TickerNotFoundError);
  });
});
```

---

### Interface Tests (Commands, Routes, Jobs)

Mock the use cases:

```typescript
describe('MarketAnalysisJob', () => {
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockRepository: jest.Mocked<ITickerRepository>;
  let job: MarketAnalysisJob;

  beforeEach(() => {
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      clear: jest.fn(),
    } as any;
    mockRepository = {
      getAll: jest.fn().mockResolvedValue([...]),
    } as any;
    job = new MarketAnalysisJob({ 
      eventBus: mockEventBus, 
      tickerRepository: mockRepository 
    });
  });

  it('should publish completion event', async () => {
    await job.execute();
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'market-analysis:complete' })
    );
  });
});
```

---

## Integration Testing Strategy

Test real implementations with mocked externals:

```typescript
describe('MarketAnalysisScheduler Integration', () => {
  it('should start and stop without errors', () => {
    const scheduler = new MarketAnalysisScheduler({
      logger,
      tickerRepository: mockRepository,
      channelId: 'test',
      eventBus: mockEventBus,
    });
    
    expect(() => {
      scheduler.start();
      scheduler.stop();
    }).not.toThrow();
  });
});
```

---

## Mocking Patterns

### Event Bus Mock
```typescript
const mockEventBus: IEventBus = {
  subscribe: jest.fn(),
  publish: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn(),
} as any;
```

### Repository Mock
```typescript
const mockRepository = {
  add: jest.fn(),
  getAll: jest.fn().mockResolvedValue([...]),
  exists: jest.fn().mockResolvedValue(true),
  remove: jest.fn(),
};
```

### Logger Mock
```typescript
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
} as any;
```

### Adapter Mock
```typescript
const mockAdapter = {
  getQuote: jest.fn().mockResolvedValue({ price: 150 }),
  getNews: jest.fn().mockResolvedValue([]),
} as any;
```

---

## What to Test

✅ **Happy path** — Normal operation  
✅ **Error handling** — What happens when things fail  
✅ **Edge cases** — Empty lists, null values, boundary conditions  
✅ **Event emission** — For event-driven code, verify events are published  
✅ **Integration points** — Where layers meet, with one side real and one mocked  

❌ **Framework internals** — Don't test Express routing logic itself  
❌ **External API calls** — Mock them always  
❌ **Database directly** — Test through repositories in integration tests  
❌ **Implementation details** — Test behavior, not how it's implemented  

---

## Coverage Goals

- **Domain**: 100% (pure logic, no deps)
- **Application**: 80%+ (mock external deps)
- **Infrastructure**: 70%+ (mock network calls)
- **Interfaces**: 60%+ (focus on routing, not framework details)

---

## Test Naming

```typescript
describe('<Component>', () => {
  describe('<Method>', () => {
    it('should <expected behavior> when <condition>', () => {
      // arrange
      // act
      // assert
    });
  });
});
```

Bad: `it('works')`  
Good: `it('should publish error event when repository fails')`

---

## Running Tests

```bash
npm run test:unit       # Unit tests with coverage
npm run test:integration # Integration tests
npm run test            # Both
```

---

## See Also

See [reference.md](reference.md) for testing checklist.  
See [examples.md](examples.md) for complete test examples.  
See [templates/](templates/) for test templates.
