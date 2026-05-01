# ARCHITECTURE.md

> **This is the source of truth for Zentra's system architecture.**
> When generating, modifying, or reviewing code — always consult this document first.

---

## What is Zentra?

Zentra is a **TypeScript modular monolith** built with **Clean Architecture**.

It supports:

- Discord bot interactions via natural language (LLM-routed) and slash commands
- HTTP API with webhook endpoints
- Ticker subscriptions with SQLite persistence
- Background worker jobs (market analysis with webhook delivery)
- Webhook-based result delivery (worker → API → Discord)
- LLM-based orchestration
- GitHub integration (issue creation & PR notifications)
- Yahoo Finance market data with sentiment analysis

---

## Architecture at a Glance

```
Interfaces → Application → Domain
                 ↓
          Infrastructure
                 ↑
            Bootstrap
```

**Principle:** Dependencies flow inward. Domain knows nothing. Infrastructure knows everything except business logic.

---

## Directory Structure

```
src/
├── bootstrap/        # App startup & DI composition
├── domain/           # Core business rules (pure TS, no deps)
├── application/      # Use cases & orchestration
├── infrastructure/   # External implementations (DB, APIs, queues)
├── interfaces/       # Entrypoints (bot, API, worker)
├── shared/           # Generic utilities (no feature logic)
└── config/           # Env, feature flags, provider config
```

---

## Layer Reference

### `bootstrap/`

Wires the app together. No business logic allowed.

```
bootstrap/
├── container.ts      # Dependency injection
├── context.ts        # Runtime context
├── main.bot.ts       # Discord bot entrypoint
├── main.api.ts       # HTTP API entrypoint
└── main.worker.ts    # Worker entrypoint
```

**Rules:** Only DI, process init, and runtime composition. Never business logic.

---

### `domain/`

Pure business rules. No framework, no I/O, no external knowledge.

```
domain/
├── entities/         # Core models (User, Issue, Repository, Ticker)
│   └── ticker.entity.ts
├── repositories/     # Repository interfaces (contracts only)
│   └── ticker.repository.ts
├── services/         # Domain services
├── events/           # Domain events
├── value-objects/    # Immutable value types
└── types/            # Shared domain types
```

**Rules:**

- ✅ Pure TypeScript logic only
- ❌ No framework imports
- ❌ No database access
- ❌ No API calls
- ❌ No knowledge of Discord, HTTP, Gemini, GitHub, or Yahoo

---

### `application/`

Use cases and orchestration. Coordinates domain logic and calls infrastructure via contracts.

```
application/
├── use-cases/        # Feature flows
│   ├── issue/        # GitHub issue creation
│   ├── trading/      # Market summary
│   ├── ticker/       # Ticker management & market analysis
│   │   ├── add-ticker.usecase.ts
│   │   ├── get-subscribed-tickers.usecase.ts
│   │   ├── analyze-market.usecase.ts
│   │   └── process-market-results.usecase.ts
│   └── user/
├── contracts/        # Abstractions for unstable dependencies
├── dto/              # Data transfer objects
│   └── market-results.dto.ts
└── orchestrators/    # LLM intent routing → use case dispatch
```

**Use cases:**

- `issue/` — creates GitHub issues, invoked when bot interprets user intent
- `trading/` — fetches and summarizes market data from Yahoo Finance via LLM
- Orchestration only — no HTTP, no Discord, no SDK calls

**Contracts** — only for likely-to-be-replaced dependencies:

- ✅ Use for: LLM providers, Market data providers
- ❌ Avoid for: GitHub, analytics, terminal

**Orchestrators** — interpret LLM output and dispatch to the correct use case:

- Must stay thin
- Must not hold business rules

---

### `infrastructure/`

All external implementations. Adapts third-party services for the app.

```
infrastructure/
├── persistence/
│   └── db/           # Implements domain repositories
│       ├── database.ts
│       └── sqlite-ticker.repository.ts
├── external/
│   ├── github/
│   ├── llm/
│   ├── yahoo/        # Market data (NEW enhanced)
│   │   ├── yahoo.adapter.ts
│   │   └── yahoo.types.ts
│   └── terminal/
├── analytics/
├── queue/
└── event-bus/
```

**Rules:**

- Implements domain repository interfaces
- Handles API transformation
- ❌ No business logic

---

### `interfaces/`

System entrypoints. Parse inputs, call use cases, return outputs. No business logic.

```
interfaces/
├── bot/
│   ├── commands/          # Slash commands
│   │   ├── add-ticker.command.ts
│   │   ├── list-tickers.command.ts
│   │   ├── market-summary.command.ts
│   │   └── ping.command.ts
│   ├── handlers/          # Natural language messages
│   └── bot.ts
├── api/
│   ├── routes/
│   │   └── webhooks.ts
│   ├── controllers/
│   │   └── market-results.controller.ts
│   └── app.ts
└── worker/
    ├── jobs/
    │   └── market-analysis.job.ts
    ├── schedulers/
    │   └── market-analysis.scheduler.ts
    └── handlers/
```

**Bot** accepts natural language messages AND slash commands:
- ✅ Slash commands for ticker management: `/add-ticker`, `/list-tickers`, `/market-summary`, `/ping`
- ✅ Natural language routing via LLM orchestrator

- LLM orchestrator handles natural language intent routing
- Slash commands call use cases directly
- ✅ Bot operations: GitHub issues, PR notifications, ticker management, market analysis
- ✅ Slash commands: `/add-ticker`, `/list-tickers`, `/market-summary`
- ❌ No DB calls from handlers — all via use cases
- ❌ No business logic in handlers

**API** handles HTTP requests and webhook delivery:
- ✅ REST endpoints for traditional operations
- ✅ Webhook endpoint: `POST /webhooks/market-results`
- ✅ Discord client integration for result delivery
- ❌ No business logic in controllers

**Worker** runs scheduled market analysis jobs:
- **Schedule:** Daily at 18 PM UTC (6 PM)
- **Flow:** `Cron → MarketAnalysisJob → AnalyzeMarketUseCase → Yahoo Finance → HTTP POST webhook → API → Discord`
- ✅ Reads tickers from SQLite database
- ✅ Sends results via webhook (decoupled from Discord)
- ❌ No business logic or direct DB writes

---

### `shared/`

Generic, reusable utilities. No feature-specific logic.

```
shared/
├── logger/
├── errors/
├── constants/
└── utils/
```

---

### `config/`

Environment variables, feature flags, and provider configuration.

---

## Dependency Rules

### ✅ Allowed

```
interfaces     → application
application    → domain
application    → contracts
infrastructure → application
infrastructure → domain
bootstrap      → all
```

### ❌ Forbidden

```
domain         → anything
application    → interfaces
application    → infrastructure
interfaces     → domain (direct)
```

---

## Worker Architecture

Zentra has three entrypoints sharing the same application core:

```
main.bot.ts
main.api.ts
main.worker.ts
```

Workers **must** reuse application use cases. Current active job:

```
Cron Scheduler (Daily 18 PM UTC)
  ↓
MarketAnalysisJob            (read subscribed tickers)
  ↓
AnalyzeMarketUseCase         (fetch Yahoo Finance data)
  ↓
Sentiment Analysis           (process news articles)
  ↓
Create WorkerWebhookPayload
  ↓
HTTP POST to API webhook
  ↓
API ProcessMarketAnalysisResultsUseCase
  ├─ Validate payload
  ├─ Create Discord embeds
  └─ Send to Discord channel
```

**Rule:** Worker is not a standalone service. It shares the same app layer.

---

## Naming Conventions

### ✅ Use

```
*.usecase.ts
*.entity.ts
*.service.ts
*.repository.ts
*.contract.ts
*.adapter.ts
*.job.ts
*.handler.ts
*.controller.ts
```

### ❌ Avoid

```
*.action.ts
*.helper.ts
*.manager.ts
```

---

## Anti-Patterns

Do not:

- Put business logic in handlers or adapters
- Call DB from `interfaces/`
- Call GitHub directly from bot handlers (go through use cases)
- Expand bot GitHub scope beyond issue creation and PR notifications without updating this document
- Create deep nested action folders
- Create god orchestrators
- Create contracts for stable dependencies

---

## Philosophy

Zentra is a **modular monolith** — one deployable unit with clear internal boundaries.

Goals:

- Shared business logic across all interfaces
- Clear dependency boundaries
- Low operational overhead
- Scalable structure
- Reusable worker architecture

**A new interface (e.g. CLI, HTTP) should never require changes to `domain/` or `application/`.**

---

## Webhook-Based Architecture

Zentra uses webhooks for **decoupled result delivery**:

```
Worker                API                  Discord
(analyzes)       (validates/formats)    (displays)
    ↓                    ↓                   ↓
Analyze tickers → POST webhook → Create embeds → Send to channel
```

**Benefits:**
- Services operate independently
- Easy horizontal scaling
- Simple testing with curl
- No Discord client in worker

**Endpoint:** `POST /webhooks/market-results` → receives market analysis → sends to Discord

---

## Ticker Management

**Domain:**
- `Ticker` entity — validates `.JK` format (Jakarta Stock Exchange)
- `ITickerRepository` interface

**Storage:**
- SQLite `tickers` table (global, non-user-specific)
- Fields: symbol, name, added_at

**Commands:**
- `/add-ticker symbol:BBCA.JK name:Bank Central Asia` → AddTickerUseCase
- `/list-tickers` → GetSubscribedTickersUseCase
- `/market-summary` → AnalyzeMarketUseCase

**Daily Job:**
- 18 PM UTC: Worker reads all tickers → analyzes each → sends webhook to API
