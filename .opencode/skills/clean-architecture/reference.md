# Layer Invariants & Rules Reference

## Complete Layer Import Matrix

### Domain Layer
**Purpose**: Core business logic, pure logic with no framework dependencies

**Can import**:
- `domain/` — Other domain entities/services
- `shared/` — Logger, utilities (but not errors from other layers)

**Cannot import**:
- `application/` — Business logic shouldn't know about use cases
- `infrastructure/` — Should not know about databases, APIs, or external services
- `interfaces/` — Should not know about Discord, Express, or job runners
- `config/` — Even configuration is external knowledge

**Why**: Domain must be framework-agnostic and testable in isolation.

---

### Application Layer
**Purpose**: Use cases, orchestration, port definitions, DTOs

**Can import**:
- `domain/` — Entities, services (yes, use them!)
- `shared/` — Logger, utilities
- `application/` — Other use cases, contracts, DTOs

**Cannot import**:
- `infrastructure/` implementations — Cannot import `YahooAdapter`, `TickerRepository` directly. Must depend on contracts only.
- `interfaces/` — Controllers, commands, handlers (wrong direction)
- `config/` directly — Configuration should be injected

**Why**: Application defines "what the system does". Infrastructure defines "how it does it". Never let application care about how.

---

### Infrastructure Layer
**Purpose**: Implementations of ports, external service adapters, database access

**Can import**:
- `domain/` — Entities to work with
- `application/` — Ports/contracts to implement
- `shared/` — Logger, utilities
- `infrastructure/` — Other infrastructure pieces
- External packages — SDKs, database drivers, etc.

**Cannot import**:
- `interfaces/` — Adapters shouldn't know about Discord or HTTP (wrong layer)

**Why**: Infrastructure implements contracts. It's okay to be implementation-specific here.

---

### Interfaces Layer
**Purpose**: Entry points (Discord bot, Express API, background jobs)

**Can import**:
- Everything — It's the orchestrator

**Cannot import**: Nothing (it's the application boundary)

**Why**: Interfaces wire up all layers. They're the start of dependency flow.

---

### Shared Layer
**Purpose**: Cross-cutting concerns (logger, utilities, errors)

**Can import**:
- `shared/` only — Other shared utilities

**Cannot import**:
- `domain/`, `application/`, `infrastructure/`, `interfaces/` — Circular dependency risk

**Why**: Shared is the foundation. Nothing should create a cycle back to it.

---

## Dependency Direction Rules

1. **Inward rule**: Higher layers depend on lower layers, never the reverse
   - Interfaces ← Application ← Domain ← Infrastructure ← Shared (Foundation)
   - OK: Application imports Domain
   - NOT OK: Domain imports Application

2. **Port/Adapter pattern**: 
   - Application defines ports (interfaces)
   - Infrastructure implements ports
   - Never: Application directly imports infrastructure implementations

3. **Shared is neutral**: Shared utilities don't belong to any layer, accessible everywhere

---

## Common Violations & Fixes

### Violation 1: Domain imports Infrastructure

```typescript
// ❌ WRONG: Domain importing infrastructure
import { TickerRepository } from '@/infrastructure/persistence';

export class Ticker {
  async save() {
    await TickerRepository.save(this);
  }
}
```

**Fix**: Domain should not know about persistence

```typescript
// ✅ CORRECT: Domain is pure logic
export class Ticker {
  symbol: string;
  name: string;

  static create(symbol: string, name: string) {
    return new Ticker(symbol, name);
  }
}
```

---

### Violation 2: Application imports Infrastructure Implementation

```typescript
// ❌ WRONG: Application depending on concrete implementation
import { YahooAdapter } from '@/infrastructure/external/yahoo';

export class AnalyzeMarketUseCase {
  constructor() {
    this.adapter = new YahooAdapter(); // Concrete dependency!
  }
}
```

**Fix**: Depend on the contract, not the implementation

```typescript
// ✅ CORRECT: Depends on contract, implementation is injected
export class AnalyzeMarketUseCase {
  constructor(private marketDataAdapter: IMarketDataAdapter) {} // Contract!

  async execute() {
    return this.marketDataAdapter.getQuote('AAPL');
  }
}

// Wire in bootstrap:
const adapter = new YahooAdapter();
const useCase = new AnalyzeMarketUseCase(adapter);
```

---

### Violation 3: Infrastructure imports Interfaces

```typescript
// ❌ WRONG: Infrastructure knowing about Discord
import { DiscordClient } from '@/interfaces/bot';

export class GitHubAdapter {
  async createIssue() {
    const channel = DiscordClient.getInstance();
  }
}
```

**Fix**: Let Interfaces orchestrate, not Infrastructure

```typescript
// ✅ CORRECT: Infrastructure is independent, Interfaces wires them
// infrastructure/external/github/github.adapter.ts
export class GitHubAdapter implements IGitHubAdapter {
  async createIssue() {
    // Just return the result
    return { issue: 123 };
  }
}

// interfaces/bot/bot.ts
const gitHubAdapter = new GitHubAdapter();
const issueResult = await gitHubAdapter.createIssue();
// Now interfaces can decide what to do with the result
```

---

## Layer Checklist

### Before committing domain code:
- [ ] No imports from `infrastructure/`
- [ ] No imports from `interfaces/`
- [ ] No imports from `config/`
- [ ] No HTTP, database, or SDK calls
- [ ] Testable without mocks

### Before committing application code:
- [ ] Depends only on `domain/`, `shared/`, and `application/`
- [ ] No concrete infrastructure imports (only contracts/ports)
- [ ] No imports from `interfaces/`
- [ ] DTOs defined, not entities
- [ ] Use cases use ports, not implementations
- [ ] Events are published, not directly called

### Before committing infrastructure code:
- [ ] Implements a port/contract from `application/`
- [ ] No imports from `interfaces/`
- [ ] Can use external packages freely
- [ ] Handles error mapping from external API to domain errors

### Before committing interface code:
- [ ] Receives all dependencies (don't construct them)
- [ ] Calls use cases, not domain or infrastructure directly
- [ ] Translates requests to DTOs
- [ ] Translates responses to domain objects or events
