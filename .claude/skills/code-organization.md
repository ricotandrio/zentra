# Code Organization Skill

> **Naming conventions, imports, and file structure**

## Naming Conventions

### File Naming

Follow these suffixes strictly. No exceptions.

| Pattern | Used For | Example |
|---------|----------|---------|
| `*.usecase.ts` | Application use cases | `analyze-market.usecase.ts` |
| `*.entity.ts` | Domain entities | `ticker.entity.ts` |
| `*.adapter.ts` | Infrastructure adapters | `github.adapter.ts` |
| `*.repository.ts` | Repository implementations | `ticker.repository.ts` |
| `*.contract.ts` | Port/interface definitions | `market-data.contract.ts` |
| `*.service.ts` | Domain services (rare) | `sentiment.service.ts` |
| `*.job.ts` | Background job implementations | `market-analysis.job.ts` |
| `*.scheduler.ts` | Job schedulers | `market-analysis.scheduler.ts` |
| `*.command.ts` | Discord slash commands | `add-ticker.command.ts` |
| `*.controller.ts` | API controllers | `market.controller.ts` |
| `*.dto.ts` | Data transfer objects | `market-results.dto.ts` |
| `*.event.ts` | Event definitions (in event-bus) | event types go in `event.types.ts` |

**File naming rule**: Use kebab-case, always lowercase, always include the suffix.

✅ `analyze-market.usecase.ts`  
❌ `analyzeMarketUseCase.ts`  
❌ `AnalyzeMarketUseCase.ts`  
❌ `analyze_market_usecase.ts`

### Class Naming

Classes use PascalCase:

```typescript
export class AnalyzeMarketUseCase {}
export class TickerEntity {}
export class GitHubAdapter {}
export class TickerRepository {}
```

### Directory Naming

Directories use kebab-case, singular or plural based on content:

```
src/
├── bootstrap/          # Multiple boostrap files
├── domain/             # Core domain
├── application/        # Application layer
│   ├── use-cases/      # Multiple use cases
│   ├── contracts/      # Multiple contracts
│   ├── dto/            # Multiple DTOs
│   └── orchestrators/  # Multiple orchestrators
├── infrastructure/     # Infrastructure layer
│   ├── external/       # External services
│   ├── persistence/    # Database layer
│   └── analytics/      # Analytics adapters
├── interfaces/         # Interface layer (entrypoints)
│   ├── api/            # HTTP API
│   ├── bot/            # Discord bot
│   └── worker/         # Background worker
├── shared/             # Shared utilities
└── config/             # Configuration
```

### Variable Naming

```typescript
// Adapters: <Service>Adapter
const githubAdapter = new GitHubAdapter();
const yahooAdapter = new YahooAdapter();

// Repositories: <Entity>Repository
const tickerRepository = new TickerRepository();

// Use Cases: <Action>UseCase
const analyzeMarketUseCase = new AnalyzeMarketUseCase();

// Event Bus, Logger: eventBus, logger
const eventBus = initializeEventBus();
const logger = getLogger();

// Mocks in tests: mock<Service> or mock<Entity>
const mockGitHub = { issues: { create: jest.fn() } };
const mockTickers = [{ symbol: 'AAPL' }, { symbol: 'GOOGL' }];
```

## Import Organization

Group imports in this order:

```typescript
// 1. External packages
import { inject, injectable } from 'tsyringe';
import { CronJob } from 'cron';

// 2. Zentra framework/shared (most general)
import { Logger } from '@/shared/logger';
import { IEventBus } from '@/shared/event-bus';

// 3. Domain layer (pure logic)
import { Ticker } from '@/domain/entities';
import { ITickerRepository } from '@/domain/repositories';

// 4. Application layer (use cases)
import { AnalyzeMarketUseCase } from '@/application/use-cases/ticker';
import { IMarketDataAdapter } from '@/application/contracts';

// 5. Infrastructure layer (adapters)
import { YahooAdapter } from '@/infrastructure/external/yahoo';
import { TickerRepository } from '@/infrastructure/persistence';

// 6. Configuration
import { env } from '@/config';

// Blank line before comments

// 7. Local imports (same directory)
import { handler } from './handler';
```

**Note**: Never import from `interfaces/` in `application/` or `domain/`. Never import `infrastructure/` implementations in `application/`.

## Module Exports

Export contracts/interfaces from `index.ts` files:

```typescript
// src/application/contracts/index.ts
export { IMarketDataAdapter } from './market-data.contract';
export { IGitHubAdapter } from './github.contract';

// src/domain/entities/index.ts
export { Ticker } from './ticker.entity';
export { User } from './user.entity';
```

Use them as:

```typescript
import { IMarketDataAdapter, Ticker } from '@/application/contracts';
```

## Path Aliases

Always use `@/` prefix:

```typescript
// ✅ Good
import { AnalyzeMarketUseCase } from '@/application/use-cases/ticker';

// ❌ Bad
import { AnalyzeMarketUseCase } from '../../../../application/use-cases/ticker';
import { AnalyzeMarketUseCase } from '../../../application/use-cases/ticker';
```

## File Organization Within Modules

```
src/application/use-cases/ticker/
├── index.ts                        # Re-exports
├── analyze-market.usecase.ts       # One use case per file
├── add-ticker.usecase.ts
├── get-subscribed-tickers.usecase.ts
└── process-market-results.usecase.ts
```

**Rule**: One exported class per file (with rare exceptions like closely related DTOs).

## Comment Style

```typescript
// For single-line comments, use sentence case
// This function transforms ticker data into events

/**
 * For multi-line documentation, use JSDoc
 * @param symbol - The stock ticker symbol
 * @returns Promise resolving to analysis results
 */
export async function analyzeMarket(symbol: string): Promise<AnalysisResult> {
  // Implementation
}
```

## Type Definitions

Put types in the same file as their usage, or in `index.ts`:

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
}
```

## Banned Patterns

❌ `*.helper.ts` — Move logic to a use case or service  
❌ `*.manager.ts` — Use use cases  
❌ `*.action.ts` — Use a command or use case  
❌ `*.util.ts` — Use `shared/`  
❌ `src/utils/` — Use `src/shared/`  
❌ Mixed kebab-case and camelCase — Pick one for each (files: kebab, variables: camel)  
❌ Circular imports — Refactor  
