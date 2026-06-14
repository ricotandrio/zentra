---
name: event-driven-patterns
description: How Zentra components communicate asynchronously using an in-memory event bus. Use when decoupling components, triggering background jobs from API, or delivering results from worker to Discord.
user-invocable: true
disable-model-invocation: false
---

# Event-Driven Architecture

How Zentra components communicate asynchronously.

## Overview

Zentra uses an **in-memory event bus** to decouple components. Instead of direct calls:

- **API** publishes `WorkerMarketAnalysisTriggerEvent` → Worker picks it up
- **Worker** publishes `MarketAnalysisCompleteEvent` → API subscriber delivers to Discord
- **Bot** publishes `TickerAddedEvent` → Can trigger worker jobs or other handlers

## Core Pattern

### 1. Define Event Types

In `src/shared/event-bus/event.types.ts`:

```typescript
export interface DomainEvent {
  type: string;
  timestamp: Date;
  source: 'api' | 'worker' | 'bot';
}

export interface WorkerMarketAnalysisTriggerEvent extends DomainEvent {
  type: 'worker:market-analysis:trigger';
}

export interface MarketAnalysisCompleteEvent extends DomainEvent {
  type: 'market-analysis:complete';
  data: {
    channelId: string;
    timestamp: string;
    results: AnalysisResult[];
  };
}

export type ApplicationEvent = 
  | WorkerMarketAnalysisTriggerEvent 
  | MarketAnalysisCompleteEvent 
  | /* ... other event types */;
```

---

### 2. Publish Events

In any use case or job:

```typescript
export class AnalyzeMarketUseCase {
  constructor(private eventBus: IEventBus) {}

  async execute(symbols: string[]): Promise<void> {
    // ... business logic ...

    await this.eventBus.publish({
      type: 'market-analysis:complete',
      source: 'worker',
      timestamp: new Date(),
      data: {
        channelId: '123456789',
        timestamp: new Date().toISOString(),
        results: [...],
      },
    });
  }
}
```

---

### 3. Subscribe to Events

In component initialization (bot, API app, etc.):

```typescript
// Bootstrap: main.bot.ts
eventBus.subscribe<MarketAnalysisCompleteEvent>(
  'market-analysis:complete',
  async (event) => {
    // Handle the event
    const channel = await discordClient.channels.fetch(event.data.channelId);
    await channel.send(`📊 Analysis Complete\nResults: ${event.data.results.length}`);
  }
);
```

---

### 4. Bootstrap Initialization

In `main.api.ts`, `main.bot.ts`, `main.worker.ts`:

```typescript
import { initializeEventBus } from '@/shared/event-bus';

const eventBus = initializeEventBus(); // Must happen first!

// Pass eventBus to all components that need it
const useCase = new AnalyzeMarketUseCase(eventBus);
const job = new MarketAnalysisJob(eventBus);
```

---

## Design Principles

✅ **One event type per semantic action** — If it's logically one thing, it's one event  
✅ **Use union types** — `ApplicationEvent = EventA | EventB | ...`  
✅ **Include source and timestamp** — Always identify origin and when it happened  
✅ **Make data immutable** — Events are facts, not mutable state  
✅ **Promise-based handlers** — Handlers can be async  

❌ **Don't create too many event types** — Group related concepts  
❌ **Don't put business logic in subscribers** — Move it to use cases  
❌ **Don't make subscribers mutate shared state** — Use a use case  
❌ **Don't forget to handle errors in subscribers** — Event bus uses `Promise.allSettled`  

---

## When to Use Events

- **Triggering background jobs** from API
- **Delivering results** from worker to API
- **Broadcasting notifications** to multiple consumers
- **Maintaining audit trails** of system actions
- **Decoupling fast and slow paths** (API responds immediately, worker runs async)

## When NOT to Use Events

- **Request-response** that needs immediate feedback → Use direct call or HTTP
- **Guaranteed delivery to one handler** → Use a queue (if we add Kafka/RabbitMQ)
- **Complex orchestration** → Use a saga pattern (future enhancement)

---

## Testing Events

In unit tests, mock the event bus:

```typescript
const mockEventBus = {
  subscribe: jest.fn(),
  publish: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn(),
} as any;
```

Then verify events were published:

```typescript
expect(mockEventBus.publish).toHaveBeenCalledWith(
  expect.objectContaining({
    type: 'market-analysis:complete',
    source: 'worker',
  })
);
```
