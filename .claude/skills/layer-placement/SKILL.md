---
name: layer-placement
description: Decide where code goes in Zentra's modular architecture using a decision tree. Use when asking "where should I put this", "which layer for X", or planning new features. Guides placement for use-cases, entities, adapters, repositories, jobs, commands, controllers within modules and shared code.
argument-hint: "[code-type] [context]"
user-invocable: true
disable-model-invocation: false
---

# Layer Placement Decision Guide

Decide where new code goes in Zentra's modular clean architecture.

## Quick Decision Tree

**Start here**: Is this part of a specific feature module (e.g., ticker-management, market-analysis)?

```
├─ YES (ticker management, market analysis, etc.)
│  └─ Place in src/modules/<feature>/
│     ├─ Business rule / entity? → src/modules/<feature>/domain/
│     ├─ Use case / orchestration? → src/modules/<feature>/application/usecases/
│     ├─ External service / adapter? → src/modules/<feature>/infrastructure/
│     └─ Module factory? → src/modules/<feature>/module.ts
│
├─ NO: Is it a bot/API/worker entrypoint (command, route, job)?
│  ├─ Discord command? → src/apps/bot/commands/
│  ├─ Discord event subscriber? → src/apps/bot/subscribers/
│  ├─ HTTP route? → src/apps/api/routes/
│  ├─ Background job? → src/modules/<feature>/job.ts
│  ├─ Scheduled task? → src/modules/<feature>/scheduler.ts
│  └─ Worker event subscriber? → src/modules/<feature>/subscriber.ts
│
├─ NO: Is it cross-module utility (logging, events, scheduling)?
│  └─ src/shared/
│     ├─ Event types & bus? → src/shared/event-bus/
│     ├─ Logging? → src/shared/logger/
│     ├─ Configuration? → src/shared/config/
│     ├─ Scheduling utilities? → src/shared/scheduler/
│     └─ Generic functions? → src/shared/utils/
│
└─ Default to appropriate shared utility
```

## Modular Architecture Pattern

Zentra organizes features into **self-contained modules**:

```
src/modules/<feature>/
├── domain/                          # Business rules (pure, no deps)
│   ├── entities/                    # Value objects, aggregates
│   └── repositories/                # Repository interfaces (ports)
├── application/
│   └── usecases/                    # Orchestration, workflows
├── infrastructure/
│   ├── db/                          # Database implementations
│   └── data-sources/                # External API adapters
├── job.ts (optional)                # Scheduled background work
├── scheduler.ts (optional)          # Cron configuration
├── subscriber.ts (optional)         # Event handlers
└── module.ts                        # Factory that exports usecases
```

**Key Principle:** Application uses domain **interfaces** (ports), never concrete implementations. Infrastructure implements those ports.

**Example: Ticker Management Module**
```
src/modules/ticker-management/
├── domain/entities/ticker.entity.ts           # Ticker value object
├── domain/repositories/ticket.repository.ts   # ITickerRepository port (abstract)
├── application/usecases/
│   ├── add-ticker.usecase.ts                  # Uses ITickerRepository
│   ├── remove-ticker.usecase.ts               # Uses ITickerRepository
│   └── get-tickers.usecase.ts                 # Uses ITickerRepository
├── infrastructure/db/
│   ├── database.ts                            # SQLite setup
│   └── sqlite-ticker.repository.ts            # ITickerRepository implementation
└── module.ts                        # Factory: createTickerManagementModule()
```

---

## Common Scenarios

### Scenario 1: "I need to add a new ticker management feature"

**Example: Remove a ticker from the watchlist**

1. **Create use case** in `src/modules/ticker-management/application/usecases/remove-ticker.usecase.ts`
   ```typescript
   export class RemoveTickerUseCase {
     constructor(private tickerRepository: ITickerRepository) {}
     async execute(input: { symbol: string }): Promise<void> {
       const ticker = await this.tickerRepository.get(input.symbol);
       if (!ticker) throw new Error(`Ticker ${input.symbol} not found`);
       await this.tickerRepository.remove(input.symbol);
     }
   }
   ```

2. **Update module factory** in `src/modules/ticker-management/module.ts`
   ```typescript
   export interface TickerManagementModule {
     addTickerUseCase: AddTickerUseCase;
     removeTickerUseCase: RemoveTickerUseCase;  // NEW
     getTickersUseCase: GetTickersUseCase;
   }
   
   export function createTickerManagementModule() {
     // ... setup ...
     return {
       addTickerUseCase: new AddTickerUseCase(repository),
       removeTickerUseCase: new RemoveTickerUseCase(repository),  // NEW
       getTickersUseCase: new GetTickersUseCase(repository),
       closeDb: () => db.close(),
     };
   }
   ```

3. **Create bot command** in `src/apps/bot/commands/remove-ticker.command.ts`
   ```typescript
   export const data = new SlashCommandBuilder()
     .setName('remove-ticker')
     .setDescription('Remove a ticker from watchlist')
     .addStringOption(option => option.setName('symbol').setRequired(true));

   export async function execute(interaction, eventBus, tickerManagementModule) {
     const symbol = interaction.options.getString('symbol', true);
     await tickerManagementModule.removeTickerUseCase.execute({ symbol });
     await interaction.reply(`✅ Removed ${symbol}`);
   }
   ```

4. **Register in bot.ts** in `src/apps/bot/bot.ts`
   ```typescript
   import * as removeTicker from './commands/remove-ticker.command';
   
   export const botCommands = {
     'add-ticker': addTicker,
     'remove-ticker': removeTicker,  // NEW
     'list-tickers': listTickers,
   };
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
