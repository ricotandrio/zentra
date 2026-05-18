---
name: layer-placement
description: Decide where code goes in Zentra's architecture using a decision tree. Use when asking "where should I put this", "which layer for X", or planning new features. Guides placement for use-cases, entities, adapters, repositories, jobs, commands, controllers.
when_to_use: Code placement questions, "where should I put", "which layer", new feature structure, architectural decisions
argument-hint: "[code-type] [context]"
user-invocable: true
disable-model-invocation: false
paths: src/**/*.ts,.claude/skills/*.md
---

# Layer Placement Decision Guide

Decide where new code goes in Zentra's architecture.

## Quick Decision Tree

**Start here**: Is it a business rule or domain concept?

```
├─ YES (business rule, domain logic, entity)
│  └─ Domain layer: src/domain/entities/, src/domain/repositories/ (interfaces)
│
├─ NO: Is it an orchestration of business rules?
│  ├─ YES (use case, workflow, orchestration)
│  │  └─ Application layer: src/application/use-cases/<feature>/
│  │
│  ├─ NO: Is it an entrypoint (Discord, HTTP, job)?
│  │  ├─ YES
│  │  │  ├─ Discord command? → src/interfaces/bot/commands/
│  │  │  ├─ HTTP route? → src/interfaces/api/routes/
│  │  │  ├─ Background job? → src/interfaces/worker/jobs/
│  │  │  └─ Event subscriber? → src/interfaces/*/subscribers/
│  │  │
│  │  ├─ NO: Is it an external service (GitHub, Yahoo, LLM)?
│  │  │  ├─ YES
│  │  │  │  ├─ Define contract: src/application/contracts/<service>.contract.ts
│  │  │  │  └─ Implement adapter: src/infrastructure/external/<service>/<service>.adapter.ts
│  │  │  │
│  │  │  ├─ NO: Is it data transfer (DTO, Response)?
│  │  │  │  └─ src/application/dto/
│  │  │  │
│  │  │  └─ Default to Shared: src/shared/
```

## Common Scenarios

### Scenario 1: "I need to add a new bot command"

**Question**: Is this a new capability or using existing logic?

**If NEW capability:**
1. Create use case: `src/application/use-cases/<feature>/<feature>.usecase.ts`
2. Create command: `src/interfaces/bot/commands/<command>.command.ts`
3. Wire in `src/interfaces/bot/commands/index.ts`

**If EXISTING capability:**
1. Just create command in `src/interfaces/bot/commands/<command>.command.ts`
2. Inject existing use case

**Example:**
```typescript
// Step 1: Use case (application layer)
export class AddTickerUseCase {
  async execute(symbol: string) { /* business logic */ }
}

// Step 2: Command (interfaces layer)
export class AddTickerCommand {
  constructor(private addTickerUseCase: AddTickerUseCase) {}
  async execute(interaction: CommandInteraction) {
    const symbol = interaction.options.getString('symbol');
    const result = await this.addTickerUseCase.execute(symbol);
    await interaction.reply(`Added ${result.symbol}`);
  }
}
```

See [examples.md](examples.md) for full example.

---

### Scenario 2: "I need to integrate a new external API"

**Question**: Is this a third-party service (GitHub, OpenAI, Yahoo Finance)?

**Always YES → Use adapter pattern:**

1. Define contract (port): `src/application/contracts/<service>.contract.ts`
2. Implement adapter: `src/infrastructure/external/<service>/<service>.adapter.ts`
3. Inject contract into use case
4. Wire in bootstrap

**Key**: Application never directly calls external SDK. Always goes through adapter.

See [examples.md](examples.md) for full example.

---

### Scenario 3: "I need to add a new database entity"

**Question**: Is this a core domain concept?

**YES → Follow these steps:**

1. Create entity: `src/domain/entities/<entity>.entity.ts`
2. Create repository interface: `src/domain/repositories/<entity>.repository.ts`
3. Implement repository: `src/infrastructure/persistence/<entity>.repository.ts`
4. Use repository in use cases

**Example:**
```
Domain (interface): src/domain/repositories/ITickerRepository
  ↑
Used by: src/application/use-cases/ticker/analyze-market.usecase.ts
  ↑
Implemented by: src/infrastructure/persistence/ticker.repository.ts
```

---

### Scenario 4: "I need to fix a bug in market analysis"

**Question**: Where does the bug live?

- **In the analysis logic?** → `src/application/use-cases/ticker/analyze-market.usecase.ts`
- **In the Yahoo Finance integration?** → `src/infrastructure/external/yahoo/`
- **In the job scheduler?** → `src/interfaces/worker/jobs/market-analysis.job.ts`
- **In the entity?** → `src/domain/entities/ticker.entity.ts`

Look at the symptom and trace it to the layer.

---

### Scenario 5: "I need a utility function"

**Question**: What does it do?

- **Business rule?** → Domain service: `src/domain/services/`
- **Cross-cutting (logging, validation)?** → Shared: `src/shared/`
- **Just a helper?** → Probably shouldn't exist. Consolidate into use case or service.

**Rule**: ❌ No `*.helper.ts`, `*.util.ts`, `*.manager.ts` files.

---

## Naming Conventions by Layer

Once you know the layer, use the right suffix:

| Suffix | Use In | Example |
|--------|--------|---------|
| `*.usecase.ts` | Application | `analyze-market.usecase.ts` |
| `*.entity.ts` | Domain | `ticker.entity.ts` |
| `*.adapter.ts` | Infrastructure | `yahoo.adapter.ts` |
| `*.repository.ts` | Infrastructure | `ticker.repository.ts` |
| `*.contract.ts` | Application | `market-data.contract.ts` |
| `*.service.ts` | Domain | `sentiment.service.ts` |
| `*.job.ts` | Interfaces/Worker | `market-analysis.job.ts` |
| `*.scheduler.ts` | Interfaces/Worker | `market-analysis.scheduler.ts` |
| `*.command.ts` | Interfaces/Bot | `add-ticker.command.ts` |
| `*.controller.ts` | Interfaces/API | `market.controller.ts` |
| `*.dto.ts` | Application | `market-results.dto.ts` |

**Never use**: `*.helper.ts`, `*.manager.ts`, `*.action.ts`, `*.util.ts`

---

## File Organization by Layer

```
src/
├── domain/                          # Pure business logic
│   ├── entities/
│   │   ├── ticker.entity.ts
│   │   └── user.entity.ts
│   ├── repositories/
│   │   ├── ticker.repository.ts     # Interfaces/ports only!
│   │   └── user.repository.ts
│   └── services/
│       └── sentiment.service.ts
│
├── application/                     # Use cases & orchestration
│   ├── use-cases/
│   │   ├── ticker/
│   │   │   ├── index.ts
│   │   │   ├── add-ticker.usecase.ts
│   │   │   ├── analyze-market.usecase.ts
│   │   │   └── get-subscribed-tickers.usecase.ts
│   │   └── user/
│   │       ├── index.ts
│   │       └── create-user.usecase.ts
│   ├── contracts/                   # Ports (interfaces to infrastructure)
│   │   ├── market-data.contract.ts
│   │   └── github.contract.ts
│   └── dto/                         # Data transfer objects
│       └── market-results.dto.ts
│
├── infrastructure/                  # Implementations
│   ├── external/                    # Third-party integrations
│   │   ├── yahoo/
│   │   │   └── yahoo.adapter.ts
│   │   ├── github/
│   │   │   └── github.adapter.ts
│   │   └── llm/
│   │       └── gemini.adapter.ts
│   └── persistence/                 # Database layer
│       ├── db/
│       │   └── client.ts            # Database connection
│       ├── ticker.repository.ts
│       └── user.repository.ts
│
├── interfaces/                      # Entrypoints
│   ├── api/
│   │   ├── app.ts
│   │   ├── routes/
│   │   │   └── market.ts
│   │   └── controllers/
│   │       └── market.controller.ts
│   ├── bot/
│   │   ├── bot.ts
│   │   ├── commands/
│   │   │   ├── index.ts
│   │   │   ├── add-ticker.command.ts
│   │   │   └── analyze-market.command.ts
│   │   ├── handlers/
│   │   └── subscribers/
│   └── worker/
│       ├── jobs/
│       │   ├── index.ts
│       │   └── market-analysis.job.ts
│       └── schedulers/
│           └── market-analysis.scheduler.ts
│
├── shared/                          # Cross-cutting
│   ├── logger/
│   │   ├── index.ts
│   │   └── logger.ts
│   ├── event-bus/
│   │   ├── index.ts
│   │   ├── event-bus.ts
│   │   └── event.types.ts
│   └── errors/
│       └── domain.errors.ts
│
├── config/
│   ├── env.ts
│   └── index.ts
│
└── bootstrap/
    ├── main.ts
    ├── main.api.ts
    ├── main.bot.ts
    └── main.worker.ts
```

---

## Decision Tree as Reference

See [decision-tree.md](decision-tree.md) for flowchart version.

See [examples.md](examples.md) for code examples of each scenario.

---

## When in Doubt

Review [clean-architecture skill](/skills/clean-architecture/SKILL.md) for layer rules and constraints.

Or ask: **"Where should I put this code?"** with context about what it does.
