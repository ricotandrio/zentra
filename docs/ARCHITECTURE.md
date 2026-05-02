# ARCHITECTURE.md — Zentra System Overview

> **Table of contents for Zentra architecture and developer guides.**
> This is the entry point. For AI agents, see [../.claude/skills/](../.claude/skills/) for focused guides on specific topics.

---

## System Overview

Zentra is a **TypeScript modular monolith** built with **Clean Architecture**.

### What It Does

- **Discord Bot** — Natural language (LLM-routed) + slash commands
- **HTTP API** — Market analysis endpoints, webhook listeners
- **Background Worker** — Scheduled market data analysis
- **Data Persistence** — SQLite ticker subscriptions
- **Integrations** — GitHub (issues, PR notifications), Yahoo Finance, LLM

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
├── bootstrap/        # Application startup & DI wiring
├── domain/           # Core business rules (pure TS, no deps)
├── application/      # Use cases & orchestration
├── infrastructure/   # External service adapters
├── interfaces/       # Entrypoints (bot, API, worker)
├── shared/           # Generic utilities
└── config/           # Environment & configuration
```

---

## Current Capabilities

| Feature | Status | Location |
|---------|--------|----------|
| **Discord Bot** — Natural language | ✅ Active | `src/interfaces/bot/handlers/` |
| **Discord Bot** — Slash commands | ✅ Active | `src/interfaces/bot/commands/` |
| **HTTP API** — Market analysis trigger | ✅ Active | `src/interfaces/api/routes/workers.ts` |
| **Worker** — Market analysis job | ✅ Active | `src/interfaces/worker/jobs/market-analysis.job.ts` |
| **Event Bus** — In-memory pub/sub | ✅ Active | `src/shared/event-bus/` |
| **GitHub** — Issue creation | ✅ Active | `src/infrastructure/external/github/` |
| **Yahoo Finance** — Market data | ✅ Active | `src/infrastructure/external/yahoo/` |
| **LLM** — Gemini routing | ✅ Active | `src/infrastructure/external/llm/` |

---

## Core Concepts

### The Three Layers

| Layer | Responsibility | Rules |
|-------|---|---|
| **Domain** | Business rules | Pure TS, no frameworks, no I/O |
| **Application** | Use cases, orchestration | Coordinates domain + infrastructure via contracts |
| **Infrastructure** | External services, adapters | All I/O, SDK calls, database access |

### The Interfaces

| Interface | Role | Location |
|-----------|------|----------|
| **Bot** | Discord entrypoint | `src/interfaces/bot/` |
| **API** | HTTP entrypoint | `src/interfaces/api/` |
| **Worker** | Background jobs | `src/interfaces/worker/` |
| **Web** | Static frontend | `src/interfaces/web/` |
| **Bootstrap** | DI wiring | `src/bootstrap/` |

### Dependency Flow

```
✅ Interfaces → Application → Domain
✅ Infrastructure → Application → Domain
✅ Bootstrap → All layers

❌ Domain → anything else
❌ Application → Infrastructure implementations
❌ Application → Interfaces
```

---

## Common Workflows

### Adding a Discord Bot Command

1. Create use case in `src/application/use-cases/<feature>/`
2. Create command in `src/interfaces/bot/commands/<command>.command.ts`
3. Register in `src/interfaces/bot/bot.ts`

### Integrating a New API

1. Define contract in `src/application/contracts/`
2. Implement adapter in `src/infrastructure/external/<service>/`
3. Inject contract into use case
4. Wire in `src/bootstrap/main.api.ts` or `main.worker.ts`

### Adding a Background Job

1. Create use case in `src/application/use-cases/<feature>/`
2. Create job in `src/interfaces/worker/jobs/<job>.job.ts`
3. Create scheduler in `src/interfaces/worker/schedulers/<scheduler>.scheduler.ts`
4. Wire in `src/bootstrap/main.worker.ts`

### Adding Tests

1. Unit test in `tests/unit/` (mock all dependencies)
2. Integration test in `tests/integration/` (mock only external services)
3. Follow patterns in [Testing Strategies](./development/testing.md)

---

## Dependency Rules Summary

**The Golden Rule:** Dependencies flow inward only.

```
Interfaces (HTTP, Discord, CLI, Workers)
     ↓ (depends on)
 Application (Use Cases)
     ↓ (depends on)
   Domain (Entities, Value Objects, Services)
     ↑ (implemented by)
Infrastructure (Adapters, Repositories, External Services)
```

**Never:**
- ❌ Domain imports anything but domain
- ❌ Application imports Infrastructure implementations
- ❌ Application imports Interfaces
