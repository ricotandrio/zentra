# ARCHITECTURE.md

> **This is the source of truth for Zentra's system architecture.**
> When generating, modifying, or reviewing code — always consult this document first.

---

## What is Zentra?

Zentra is a **TypeScript modular monolith** built with **Clean Architecture**.

It supports:

- Discord bot interactions via natural language (LLM-routed)
- HTTP API
- Background worker jobs (market summary)
- LLM-based orchestration
- GitHub integration (issue creation & PR notifications)
- Yahoo Finance market data

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
├── entities/         # Core models (User, Issue, Repository)
├── repositories/     # Repository interfaces (contracts only)
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
│   ├── issue/        # GitHub issue creation (triggered by bot)
│   ├── trading/      # Market summary (triggered by worker)
│   └── user/
├── contracts/        # Abstractions for unstable dependencies
│   ├── llm.contract.ts
│   └── market.contract.ts
├── dto/              # Data transfer objects
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
│   └── db/           # Implements domain repositories (no business logic)
├── external/
│   ├── github/
│   ├── llm/          # Implements LlmContract
│   ├── yahoo/        # Implements MarketContract
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
│   ├── handlers/         # Natural language message handler (no slash commands)
│   ├── presenters/       # Format and send Discord responses
│   └── services/         # Bot-scoped helpers
├── api/
│   ├── routes/
│   ├── controllers/
│   └── presenters/
└── worker/
    ├── jobs/
    │   └── market-summary.job.ts   # Only active job
    ├── schedulers/
    └── handlers/
```

**Bot** accepts natural language messages only — no slash command handlers.

- The LLM orchestrator interprets user intent and routes to the correct use case
- ✅ Bot may trigger: GitHub issue creation, GitHub PR notification (on PR open events)
- ❌ No other GitHub operations allowed from the bot
- ❌ No DB calls, no business logic

**API** handles HTTP request/response only.

**Worker** currently runs one job: market summary from Yahoo Finance.

- Flow: `Cron → MarketSummaryJob → SummarizeMarketUseCase → Yahoo + LLM`
- ❌ No direct business logic or DB access

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
Cron Scheduler
  ↓
MarketSummaryJob             (interfaces/worker/jobs/market-summary.job.ts)
  ↓
SummarizeMarketUseCase       (application/use-cases/trading)
  ↓
Yahoo Finance + LLM          (infrastructure/external)
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

**A new interface (e.g. CLI, webhook) should never require changes to `domain/` or `application/`.**
