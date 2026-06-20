# Event-Driven Architecture

Decouple components using an in-memory event bus. Components publish semantic events; others subscribe and react.

## Pattern Flow

```
API (Express) ──publishes──> WorkerTriggerEvent ──> Event Bus ──> Worker Job
                                                  ──> Bot Subscriber

Worker (Job) ─publishes─> AnalysisCompleteEvent ──> Event Bus ──> Discord Delivery
```

**Key Benefit**: Fast path (API returns immediately) + slow path (worker runs async).

## Step 1: Define Event Types

In `src/shared/event-bus/event.types.ts`:

```typescript
// Base interface for all events
export interface DomainEvent {
  type: string;
  timestamp: Date;
  source: 'api' | 'worker' | 'bot';
}

// Specific events
export interface MarketAnalysisTriggerEvent extends DomainEvent {
  type: 'market-analysis:trigger';
  data: { symbols: string[]; channelId: string };
}

export interface MarketAnalysisCompleteEvent extends DomainEvent {
  type: 'market-analysis:complete';
  data: { channelId: string; results: AnalysisResult[] };
}

// Union type for type safety
export type ApplicationEvent = 
  | MarketAnalysisTriggerEvent 
  | MarketAnalysisCompleteEvent;
```

## Step 2: Publish Events in Use Cases

```typescript
// src/modules/market-analysis/application/analyze-market.usecase.ts
export class AnalyzeMarketUseCase {
  constructor(private eventBus: IEventBus) {}

  async execute(symbols: string[], channelId: string): Promise<void> {
    // Business logic here
    const results = await this.analyze(symbols);

    // Publish event for subscribers
    await this.eventBus.publish({
      type: 'market-analysis:complete',
      source: 'worker',
      timestamp: new Date(),
      data: { channelId, results },
    } as MarketAnalysisCompleteEvent);
  }

  private async analyze(symbols: string[]): Promise<AnalysisResult[]> {
    // Pure business logic
    return symbols.map(s => ({ symbol: s, trend: 'bullish' }));
  }
}
```

## Step 3: Subscribe to Events at Bootstrap

```typescript
// src/bootstrap/main.bot.ts
import { initializeEventBus } from '@/shared/event-bus';
import { Client } from 'discord.js';

const eventBus = initializeEventBus();
const discordClient = new Client();

// Subscribe: when analysis completes, send to Discord
eventBus.subscribe<MarketAnalysisCompleteEvent>(
  'market-analysis:complete',
  async (event) => {
    const channel = await discordClient.channels.fetch(event.data.channelId);
    await (channel as TextChannel).send(
      `📊 Analysis Complete: ${event.data.results.length} results`
    );
  }
);

// Another subscriber can listen to same event
eventBus.subscribe<MarketAnalysisCompleteEvent>(
  'market-analysis:complete',
  async (event) => {
    console.log(`[Audit] Analysis completed for channel ${event.data.channelId}`);
  }
);
```

## Step 4: Inject Event Bus Everywhere

```typescript
// src/bootstrap/main.api.ts
const eventBus = initializeEventBus();

// Inject into use cases
const analyzeMarketUseCase = new AnalyzeMarketUseCase(eventBus);

// Pass to controller
const analyzeController = new AnalyzeController(analyzeMarketUseCase);

// Export for middleware
export { eventBus };
```

```typescript
// src/apps/api/controllers/analyze.controller.ts
@Controller('/analyze')
export class AnalyzeController {
  constructor(private analyzeMarketUseCase: AnalyzeMarketUseCase) {}

  @Post()
  async handle(@Body() dto: AnalyzeDto) {
    // Returns immediately (doesn't wait for worker)
    await this.analyzeMarketUseCase.execute(dto.symbols, dto.channelId);
    return { status: 'triggered' };
  }
}
```

## Design Principles

✅ **One event type = One semantic action** — `market-analysis:complete` not `market:event:complete:v2`  
✅ **Always include source and timestamp** — Helps debugging and auditing  
✅ **Make event data immutable** — Events are facts, freeze them  
✅ **Handlers should be idempotent** — Handle duplicates gracefully  
✅ **Use union types** — `ApplicationEvent = EventA | EventB | ...` for type safety  

❌ **Don't put business logic in subscribers** — Keep subscribers thin, use use cases  
❌ **Don't create event handlers that mutate global state** — Use a use case instead  
❌ **Don't forget error handling** — Event bus uses `Promise.allSettled`, errors don't crash it  
❌ **Don't make subscribers synchronous** — Make them async even if logic is fast  

## Decision Table: Events vs Direct Calls

| Scenario | Use Events | Use Direct Call |
|----------|-----------|-----------------|
| API triggers worker job | ✅ | ❌ |
| Controller needs use case result immediately | ❌ | ✅ |
| Multiple subscribers need result | ✅ | ❌ |
| Worker delivers result to Discord | ✅ | ❌ |
| One service calls another | ❌ | ✅ |
| Audit trail needed | ✅ | Maybe |

## Testing Events

Mock the event bus in tests:

```typescript
const mockEventBus = {
  subscribe: jest.fn(),
  publish: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn(),
} as any;

const useCase = new AnalyzeMarketUseCase(mockEventBus);

it('publishes analysis complete event', async () => {
  await useCase.execute(['AAPL', 'MSFT'], 'channel-123');
  
  expect(mockEventBus.publish).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'market-analysis:complete',
      source: 'worker',
      data: expect.objectContaining({ channelId: 'channel-123' }),
    })
  );
});

it('subscriber handles event', async () => {
  const handler = jest.fn();
  eventBus.subscribe('market-analysis:complete', handler);
  
  await eventBus.publish({
    type: 'market-analysis:complete',
    source: 'worker',
    timestamp: new Date(),
    data: { channelId: 'ch-1', results: [] },
  });
  
  expect(handler).toHaveBeenCalled();
});
```

## Implementation Checklist

- [ ] Event types defined in `event.types.ts`
- [ ] Event base interface includes `type`, `timestamp`, `source`
- [ ] Union type exported: `type ApplicationEvent = Event1 | Event2 | ...`
- [ ] Use cases inject `IEventBus` (not `EventBus` directly)
- [ ] Events published in use cases, not in handlers/controllers
- [ ] Subscribers are thin (call use cases if complex logic needed)
- [ ] Event bus initialized once in bootstrap
- [ ] All components receive eventBus from container/bootstrap
- [ ] Tests mock the event bus
- [ ] Error handling in subscribers (wrapped in try/catch or Promise.allSettled)
- [ ] No circular event dependencies (A publishes → B subscribes → A publishes)
- [ ] Documentation updated if new event types added
