# ARCHITECTURE.md — Zentra System Overview

> **Table of contents for Zentra architecture and developer guides.**
> This is the entry point. For AI agents, see [../.claude/skills/](../.claude/skills/) for focused guides on specific topics.

---

## System Overview

Zentra is a **TypeScript modular monolith** built with **Clean Architecture**.

### What It Does

- **Discord Bot** — Natural language (LLM-routed) + slash commands, ticker management (`/add-ticker`, `/remove-ticker`, `/list-tickers`)
- **HTTP API** — Market analysis triggers, webhook listeners
- **Background Worker** — Scheduled market data analysis (6 PM UTC+7) with Playwright-based web scraping
- **Data Persistence** — SQLite ticker subscriptions management
- **Integrations** — GitHub (issues, PR notifications), IDX (Indonesian Stock Exchange real-time market data), Yahoo Finance, LLM (Gemini)

### Architecture Principle

```
Interfaces → Application → Domain
                 ↓
          Infrastructure
                 ↑
            Bootstrap
```

**Dependencies flow inward. Domain is pure logic. Infrastructure handles external services.**

---

## Directory Structure

```
src/
├── bootstrap/           # Application startup & DI wiring
├── apps/
│   ├── api/            # Express HTTP server (REST endpoints)
│   ├── bot/            # Discord.js bot (commands, subscribers, handlers)
│   └── web/            # Static web frontend
├── modules/            # Feature modules (domain + application + infrastructure)
│   ├── ticker-management/
│   │   ├── domain/      # Ticker entity & repository interface
│   │   ├── application/ # AddTickerUseCase, RemoveTickerUseCase, GetTickersUseCase
│   │   ├── infrastructure/ # SQLite repository implementation, database setup
│   │   └── index.ts     # TickerManagementModule factory
│   └── market-analysis/
│       ├── domain/      # (Reserved for future domain logic)
│       ├── application/ # AnalyzeTickersUseCase, MarketSummaryUseCase
│       ├── infrastructure/ # MarketScraperAdapter (Playwright), Yahoo Finance integration
│       └── index.ts     # Module exports
├── shared/              # Cross-module utilities
│   ├── event-bus/       # In-memory pub/sub event system
│   ├── logger/          # Structured logging
│   ├── config/          # Environment & configuration
│   ├── scheduler/       # Cron-based scheduler utilities
│   └── utils/           # Generic functions (map, functional utilities)
└── interfaces/          # (Legacy) May be migrated into apps/

---

## Current Capabilities

| Feature | Status | Location |
|---------|--------|----------|
| **Discord Bot** — Natural language routing | ✅ Active | `src/apps/bot/handlers/` |
| **Discord Bot** — Slash commands (add/remove/list tickers) | ✅ Active | `src/apps/bot/commands/` |
| **Discord Bot** — Market analysis results | ✅ Active | `src/apps/bot/subscribers/market-analysis.subscriber.ts` |
| **Discord Bot** — Market summary delivery | ✅ Active | `src/apps/bot/subscribers/market-summary.subscriber.ts` |
| **HTTP API** — Market analysis trigger | ✅ Active | `src/apps/api/routes/workers.ts` |
| **HTTP API** — Webhook listeners | ✅ Active | `src/apps/api/routes/webhooks.ts` |
| **Worker** — Market analysis job (scheduled) | ✅ Active | `src/modules/market-analysis/job.ts` |
| **Event Bus** — In-memory pub/sub | ✅ Active | `src/shared/event-bus/` |
| **Ticker Management** — Add/remove/list tickers | ✅ Active | `src/modules/ticker-management/` |
| **Market Data** — Playwright scraper (IDX) | ✅ Active | `src/modules/market-analysis/infrastructure/data-sources/market-scraper.adapter.ts` |
| **GitHub** — Issue creation & PR notifications | ✅ Active | `src/apps/api/infrastructure/external/github/` |
| **LLM** — Gemini routing | ✅ Active | `src/apps/api/infrastructure/external/llm/` |
| **Database** — SQLite ticker subscriptions | ✅ Active | `src/modules/ticker-management/infrastructure/db/` |

---

## Core Concepts

### Modular Architecture

Zentra uses **feature-based modules** within clean architecture:

```
Module = Domain + Application + Infrastructure
         └─ Encapsulates a feature
         └─ Exports TickerManagementModule, MarketAnalysisModule factory
         └─ Injected as dependencies
```

**Example: Ticker Management Module**
```
src/modules/ticker-management/
├── domain/
│   ├── entities/ticker.entity.ts       # Ticker value object
│   └── repositories/ticker.repository.ts  # ITickerRepository interface (port)
├── application/
│   └── usecases/
│       ├── add-ticker.usecase.ts
│       ├── remove-ticker.usecase.ts    # NEW
│       └── get-tickers.usecase.ts
├── infrastructure/
│   └── db/
│       ├── database.ts                 # SQLite setup
│       └── sqlite-ticker.repository.ts # ITickerRepository implementation (adapter)
└── module.ts                           # Factory: createTickerManagementModule()
```

**Dependencies within module:**
```
Application ─→ Domain (interfaces)
    ↓
Infrastructure (implements Domain interfaces)
    ↓
Database
```

### The Three Layers

| Layer | Responsibility | Rules |
|-------|---|---|
| **Domain** | Business rules, entities, repository interfaces (ports) | Pure TS, no frameworks, no I/O |
| **Application** | Use cases, orchestration, coordination | Depends on domain ports, not implementations |
| **Infrastructure** | External services, adapters, repository implementations | All I/O, SDK calls, database access |

### Integration Points

| Component | Type | Event Types Published |
|-----------|------|-----|
| **Add Ticker Command** | Discord slash command | `ticker:added` |
| **Remove Ticker Command** | Discord slash command | (Event publishing removed; consider use case) |
| **Market Analysis Job** | Scheduled worker (6 PM UTC+7) | `market-analysis:complete`, `market-analysis:error` |
| **Market Summary Job** | Part of market-analysis job | `market-summary:complete` |
| **Market Analysis Subscriber** | Event handler (bot) | Receives `market-analysis:complete`, posts embed |
| **Market Summary Subscriber** | Event handler (bot) | Receives `market-summary:complete`, posts embed |

### The Interfaces

| Interface | Role | Location |
|-----------|------|----------|
| **Discord Bot** | Discord entrypoint + commands + event subscribers | `src/apps/bot/` |
| **HTTP API** | Express REST endpoints | `src/apps/api/` |
| **Worker** | Scheduled jobs & event subscribers | `src/modules/market-analysis/job.ts` |
| **Web** | Static frontend | `src/apps/web/` |
| **Bootstrap** | DI wiring | `src/bootstrap/main.ts` |

### Dependency Flow

```
✅ Interfaces → Application → Domain
✅ Infrastructure → Application → Domain
✅ Bootstrap → All layers
✅ Modules → Shared utilities

❌ Domain → anything else
❌ Application → Infrastructure implementations (only interfaces/ports)
❌ Application → Interfaces
```

---

## Common Workflows

### Adding a Ticker Management Feature

1. **Define use case** in `src/modules/ticker-management/application/usecases/<feature>.usecase.ts`
2. **Add to module factory** in `src/modules/ticker-management/module.ts`
3. **Create bot command** in `src/apps/bot/commands/<command>.command.ts` (if Discord feature)
4. **Register command** in `src/apps/bot/bot.ts` botCommands registry
5. **Publish event** if needed (e.g., `ticker:added`, `ticker:removed`)

**Example: Add Ticker**
```typescript
// 1. Use case (application layer)
export class AddTickerUseCase {
  constructor(private tickerRepository: ITickerRepository) {}
  async execute(input: { symbol: string }): Promise<void> {
    const ticker = Ticker.create(input.symbol);
    await this.tickerRepository.add(ticker);
  }
}

// 2. Module factory includes use case
export interface TickerManagementModule {
  addTickerUseCase: AddTickerUseCase;
}

// 3. Command uses use case
export async function execute(interaction, module) {
  const symbol = interaction.options.getString('symbol');
  await module.addTickerUseCase.execute({ symbol });
  await interaction.reply(`✅ Added ${symbol}`);
}

// 4. Register in bot.ts
export const botCommands = {
  'add-ticker': addTicker,
};
```

### Integrating Market Data Source

1. **Create adapter** in `src/modules/market-analysis/infrastructure/data-sources/<source>.adapter.ts`
2. **Define types** in `src/modules/market-analysis/infrastructure/data-sources/<source>.types.ts`
3. **Create use case** in `src/modules/market-analysis/application/usecases/<feature>.usecase.ts`
4. **Inject into job** in `src/modules/market-analysis/job.ts`

**Current Implementation: Playwright Market Scraper**
```typescript
// src/modules/market-analysis/infrastructure/data-sources/market-scraper.adapter.ts
export class MarketScraperAdapter {
  async initialize(): Promise<void> { /* Launch Chromium */ }
  async getTradingSummary(): Promise<MarketTickerData[]> { /* Fetch from IDX */ }
  async getMarketSummary(): Promise<MarketSummary> { /* Aggregate rankings */ }
  async close(): Promise<void> { /* Clean up */ }
}
```

### Publishing Events from Jobs

1. **Inject event bus** into job
2. **Call eventBus.publish()** with typed event
3. **Create event subscriber** in `src/apps/bot/subscribers/<event>.subscriber.ts`
4. **Wire subscriber** in `src/apps/bot/bot.ts` startBot() function

**Example: Market Analysis Job publishes two events**
```typescript
// Job: src/modules/market-analysis/job.ts
async execute(config) {
  // Publish market-analysis:complete with ticker analysis results
  await config.eventBus.publish({
    type: 'market-analysis:complete',
    source: 'worker',
    data: { channelId, results: [...] }
  });

  // Publish market-summary:complete with aggregated market data
  await config.eventBus.publish({
    type: 'market-summary:complete',
    source: 'worker',
    data: { channelId, summary: {...} }
  });
}

// Subscriber: src/apps/bot/subscribers/market-analysis.subscriber.ts
export function registerMarketAnalysisSubscriber(client, eventBus) {
  eventBus.subscribe('market-analysis:complete', async (event) => {
    const channel = await client.channels.fetch(event.data.channelId);
    const embed = formatAnalysisResults(event.data.results);
    await channel.send({ embeds: [embed] });
  });
}
```

### Adding Tests

1. **Unit test** in `tests/unit/` (mock all dependencies)
2. **Integration test** in `tests/integration/` (mock only external services)
3. **Follow patterns** in [Testing Strategies](../.claude/skills/testing-strategies/SKILL.md)

---

## Dependency Rules Summary

**The Golden Rule:** Dependencies flow inward only.

```
Interfaces (HTTP, Discord, Worker)
     ↓ (depends on)
 Application (Use Cases)
     ↓ (depends on)
   Domain (Entities, Ports/Interfaces)
     ↑ (implemented by)
Infrastructure (Adapters, Repositories)
```

**Never:**
- ❌ Domain imports anything but domain
- ❌ Application imports Infrastructure implementations (only interfaces/ports)
- ❌ Application imports Interfaces
- ❌ One module directly imports another module's implementation (use factories & interfaces)
