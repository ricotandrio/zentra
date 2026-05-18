---
name: code-standards
description: Naming conventions, file organization, imports, and code style for Zentra. Use for "how should I name this", "where do imports go", code structure questions, or type definitions.
when_to_use: Naming conventions, file organization, import order, code structure, "what pattern", type definitions, "how should I organize"
user-invocable: true
disable-model-invocation: false
paths: src/**/*.ts,.claude/skills/*.md
---

# Code Standards & Organization

Naming conventions, imports, file structure for Zentra code.

## File Naming Convention

### By Function (The Suffix)

Use these suffixes strictly. No exceptions.

| Suffix | Use For | Example |
|--------|---------|---------|
| `*.usecase.ts` | Application use cases | `analyze-market.usecase.ts` |
| `*.entity.ts` | Domain entities | `ticker.entity.ts` |
| `*.adapter.ts` | Infrastructure adapters | `yahoo.adapter.ts` |
| `*.repository.ts` | Repository implementations | `ticker.repository.ts` |
| `*.contract.ts` | Port/interface definitions | `market-data.contract.ts` |
| `*.service.ts` | Domain services | `sentiment.service.ts` |
| `*.job.ts` | Background job implementations | `market-analysis.job.ts` |
| `*.scheduler.ts` | Job schedulers | `market-analysis.scheduler.ts` |
| `*.command.ts` | Discord slash commands | `add-ticker.command.ts` |
| `*.controller.ts` | API controllers | `market.controller.ts` |
| `*.dto.ts` | Data transfer objects | `market-results.dto.ts` |
| `*.event.ts` | Event definitions | event types go in `event.types.ts` |

**Rule**: Use kebab-case (lowercase, hyphens), always include the suffix.

✅ `analyze-market.usecase.ts`  
❌ `analyzeMarketUseCase.ts`  
❌ `AnalyzeMarketUseCase.ts`  
❌ `analyze_market_usecase.ts`

---

### Class Naming

Classes use PascalCase, even in kebab-case files:

```typescript
// analyze-market.usecase.ts
export class AnalyzeMarketUseCase {}

// ticker.entity.ts
export class TickerEntity {}

// yahoo.adapter.ts
export class YahooAdapter {}

// market-data.contract.ts
export interface IMarketDataAdapter {}
```

---

### Directory Naming

Directories use kebab-case, singular or plural based on content:

```
src/
├── bootstrap/          # Multiple files, plural
├── domain/             # Layer, singular
├── application/        # Layer, singular
│   ├── use-cases/      # Multiple, plural
│   ├── contracts/      # Multiple, plural
│   ├── dto/            # Multiple, plural
│   └── orchestrators/  # Multiple, plural
├── infrastructure/     # Layer, singular
│   ├── external/       # Services/adapters, plural
│   └── persistence/    # Database, plural
├── interfaces/         # Layer, plural (multiple entry types)
│   ├── api/            # API entry, singular
│   ├── bot/            # Bot entry, singular
│   └── worker/         # Worker entry, singular
├── shared/             # Shared layer, singular
│   ├── logger/         # Concern, singular
│   ├── event-bus/      # Concern, singular
│   └── errors/         # Multiple errors, plural
└── config/             # Configuration, singular
```

---

## Variable Naming

### Adapter Instances
```typescript
const githubAdapter = new GitHubAdapter();
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
