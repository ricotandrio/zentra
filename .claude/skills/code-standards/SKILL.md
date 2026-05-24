---
name: code-standards
description: Naming conventions, file organization, imports, and code style for Zentra. Use for "how should I name this", "where do imports go", code structure questions, or type definitions. Includes modular architecture patterns.
user-invocable: true
disable-model-invocation: false
---

# Code Standards & Organization

Naming conventions, imports, file structure for Zentra's modular clean architecture.

## Module Structure

Each feature module follows clean architecture layers:

```
src/modules/<feature>/
├── domain/
│   ├── entities/
│   │   └── <entity>.entity.ts              # Value objects, aggregates
│   └── repositories/
│       └── <entity>.repository.ts          # Interface/port (abstract)
├── application/
│   └── usecases/
│       ├── <action>.usecase.ts             # Orchestration
│       └── index.ts                        # Barrel export
├── infrastructure/
│   ├── db/
│   │   ├── <database>.ts                   # DB setup/migrations
│   │   └── <type>-<entity>.repository.ts   # Adapter (implementation)
│   └── data-sources/
│       ├── <source>.adapter.ts             # External service wrapper
│       └── <source>.types.ts               # DTO/response types
├── job.ts                                  # Scheduled job (optional)
├── scheduler.ts                            # Cron config (optional)
├── subscriber.ts                           # Event handler (optional)
├── index.ts                                # Module public exports
└── module.ts                               # DI factory
```

---

## File Naming Convention

### By Function (The Suffix)

Use these suffixes strictly. No exceptions.

| Suffix | Use For | Example | Location |
|--------|---------|---------|----------|
| `*.usecase.ts` | Application use cases | `analyze-market.usecase.ts` | `application/usecases/` |
| `*.entity.ts` | Domain entities | `ticker.entity.ts` | `domain/entities/` |
| `*.adapter.ts` | Infrastructure adapters | `market-scraper.adapter.ts` | `infrastructure/data-sources/` |
| `*.types.ts` | DTO/response types | `market-scraper.types.ts` | `infrastructure/data-sources/` |
| `*.repository.ts` | Repository interfaces & implementations | `ticker.repository.ts` | `domain/repositories/` or `infrastructure/db/` |
| `*.contract.ts` | Port/interface definitions (external services) | `market-data.contract.ts` | `application/contracts/` |
| `*.service.ts` | Domain services | `sentiment.service.ts` | `domain/services/` |
| `*.job.ts` | Background job implementations | `market-analysis.job.ts` | module root |
| `*.scheduler.ts` | Job schedulers | `market-analysis.scheduler.ts` | module root |
| `*.subscriber.ts` | Event handlers | `market-summary.subscriber.ts` | module root or `apps/bot/subscribers/` |
| `*.command.ts` | Discord slash commands | `add-ticker.command.ts` | `apps/bot/commands/` |
| `*.controller.ts` | API controllers | `market.controller.ts` | `apps/api/controllers/` |
| `*.dto.ts` | Data transfer objects | `market-results.dto.ts` | `application/dto/` |
| `module.ts` | Module DI factory | `module.ts` | module root |

**Rule**: Use kebab-case (lowercase, hyphens), always include the suffix.

✅ `analyze-market.usecase.ts`  
✅ `market-scraper.adapter.ts`  
❌ `analyzeMarketUseCase.ts`  
❌ `MarketScraperAdapter.ts`  
❌ `analyze_market_usecase.ts`

---

### Class Naming

Classes use PascalCase, even in kebab-case files:

```typescript
// analyze-market.usecase.ts
export class AnalyzeMarketUseCase {}

// ticker.entity.ts
export class Ticker {}

// market-scraper.adapter.ts
export class MarketScraperAdapter {}

// ticker.repository.ts
export interface ITickerRepository {}
export class SqliteTickerRepository implements ITickerRepository {}
```

---

### Interface Naming (Ports)

Domain repository interfaces use `I` prefix:

```typescript
// domain/repositories/ticker.repository.ts
export interface ITickerRepository {
  add(ticker: Ticker): Promise<void>;
  get(symbol: string): Promise<Ticker | null>;
  remove(symbol: string): Promise<void>;
}

// infrastructure/db/sqlite-ticker.repository.ts
export class SqliteTickerRepository implements ITickerRepository {
  // Concrete implementation
}
```

---

### Module Factory Naming

Each module exports a factory function and interface:

```typescript
// ticker-management/module.ts
export interface TickerManagementModule {
  addTickerUseCase: AddTickerUseCase;
  removeTickerUseCase: RemoveTickerUseCase;
  getTickersUseCase: GetTickersUseCase;
  closeDb: () => void;  // Resource cleanup
}

export function createTickerManagementModule(): TickerManagementModule {
  // Setup and return module
}
```

**Pattern**: `{Feature}Module` interface, `create{Feature}Module()` factory.

---

### Directory Naming

Directories use kebab-case, singular or plural based on content:

```
src/
├── bootstrap/          # Multiple files, plural
├── modules/            # Multiple modules
│   ├── ticker-management/   # Feature module, singular
│   └── market-analysis/     # Feature module, singular
├── apps/               # Multiple app entries
│   ├── api/            # API app, singular
│   ├── bot/            # Bot app, singular
│   └── web/            # Web frontend, singular
├── shared/             # Shared layer, singular
│   ├── logger/         # Concern, singular
│   ├── event-bus/      # Concern, singular
│   ├── scheduler/      # Concern, singular
│   ├── config/         # Configuration, singular
│   └── utils/          # Utilities, plural
```

**Pattern**: Feature modules in `src/modules/<feature>/`, apps in `src/apps/<app>/`.

---

## Variable Naming

### Adapter Instances
```typescript
const marketScraperAdapter = new MarketScraperAdapter();
const yahooAdapter = new YahooAdapter();
const geminiAdapter = new GeminiAdapter();
```

### Repository Instances
```typescript
const tickerRepository = new TickerRepository();
const userRepository = new UserRepository();
```

### Use Case Instances
```typescript
const analyzeMarketUseCase = new AnalyzeMarketUseCase();
const addTickerUseCase = new AddTickerUseCase();
```

### Singletons (Logger, EventBus)
```typescript
const eventBus = initializeEventBus();
const logger = getLogger();
```

### Mock Objects (in tests)
```typescript
const mockGitHub = { issues: { create: jest.fn() } };
const mockTickers = [{ symbol: 'AAPL' }, { symbol: 'GOOGL' }];
const mockRepository = jest.fn();
```

---

## Import Organization

Group imports in this specific order, with blank lines between groups:

```typescript
// 1. External packages
import { inject, injectable } from 'tsyringe';
import { CronJob } from 'cron';
import axios from 'axios';

// 2. Shared framework utilities (most general)
import { Logger } from '@/shared/logger';
import { IEventBus } from '@/shared/event-bus';
import { DomainError } from '@/shared/errors';

// 3. Domain layer (pure business logic)
import { TickerEntity } from '@/domain/entities';
import { ITickerRepository } from '@/domain/repositories';

// 4. Application layer (use cases and contracts)
import { AnalyzeMarketUseCase } from '@/application/use-cases/ticker';
import { IMarketDataAdapter } from '@/application/contracts';
import { MarketResultsDto } from '@/application/dto';

// 5. Infrastructure layer (implementations)
import { YahooAdapter } from '@/infrastructure/external/yahoo';
import { TickerRepository } from '@/infrastructure/persistence';

// 6. Configuration
import { env } from '@/config';

// 7. Local imports (same directory or relative)
import { handler } from './handler';
import { utils } from '../utils';
```

**Critical Rules**:
- ❌ Never import from `interfaces/` in `application/` or `domain/`
- ❌ Never import infrastructure implementations in `application/` (only contracts)
- ✅ Always use `@/` prefix for absolute paths

---

## Module Exports

Export contracts/interfaces and entities from `index.ts` files:

```typescript
// src/application/contracts/index.ts
export { IMarketDataAdapter } from './market-data.contract';
export { IGitHubAdapter } from './github.contract';

// src/domain/entities/index.ts
export { TickerEntity } from './ticker.entity';
export { UserEntity } from './user.entity';

// src/application/use-cases/ticker/index.ts
export { AnalyzeMarketUseCase } from './analyze-market.usecase';
export { AddTickerUseCase } from './add-ticker.usecase';
```

Then import as:
```typescript
import { IMarketDataAdapter, TickerEntity, AnalyzeMarketUseCase } from '@/application/contracts';
```

---

## Path Aliases

Always use `@/` prefix for imports:

```typescript
// ✅ Good
import { AnalyzeMarketUseCase } from '@/application/use-cases/ticker';
import { TickerEntity } from '@/domain/entities';

// ❌ Bad
import { AnalyzeMarketUseCase } from '../../../../application/use-cases/ticker';
import { TickerEntity } from '../../../domain/entities';
```

See [reference.md](reference.md) for tsconfig path alias configuration.

---

## File Organization Within Modules

```
src/application/use-cases/ticker/
├── index.ts                        # Re-exports for convenience
├── analyze-market.usecase.ts       # One use case per file
├── add-ticker.usecase.ts
├── get-subscribed-tickers.usecase.ts
└── process-market-results.usecase.ts
```

**Rule**: One exported class per file (with rare exceptions like closely related DTOs).

**Rationale**: Easy to find, easy to test, prevents god objects.

---

## Comment Style

### Single-line Comments
Use sentence case with proper grammar:

```typescript
// This function transforms ticker data into events.
// Cache results for 1 hour to reduce API calls.
```

### Multi-line Documentation
Use JSDoc for public APIs:

```typescript
/**
 * Analyzes market data for the given symbols.
 * @param symbols - Array of stock ticker symbols (e.g., ['AAPL', 'GOOGL'])
 * @returns Promise resolving to analysis results with prices and sentiment
 * @throws {TickerNotFoundError} If a symbol doesn't exist
 * @throws {MarketDataError} If fetching fails
 */
export async function analyzeMarket(symbols: string[]): Promise<AnalysisResult[]> {
  // Implementation
}
```

---

## Type Definitions

Put types in the same file as their usage, or in a central `index.ts`:

```typescript
// src/application/dto/index.ts
export interface MarketResultsPayload {
  channelId: string;
  results: AnalysisResult[];
}

export interface AnalysisResult {
  ticker: string;
  price: number;
  sentiment: number;
  changePercent: number;
}

export type TickerAnalysis = AnalysisResult & {
  newsCount: number;
};
```

---

## Banned Patterns

❌ `*.helper.ts` — Move logic to a use case or service  
❌ `*.manager.ts` — Use use cases  
❌ `*.action.ts` — Use a command or use case  
❌ `*.util.ts` — Use `shared/`  
❌ `src/utils/` — Use `src/shared/`  
❌ Mixed naming styles — Pick kebab-case for files, camelCase for variables  
❌ Circular imports — Refactor to break the cycle  

---

## See Also

For layer-specific organization, see [layer-placement skill](/skills/layer-placement/SKILL.md).  
For detailed specifications, see [reference.md](reference.md).  
For code examples, see [examples.md](examples.md).
