# Code Standards Reference

Complete specification for naming, organization, and imports.

## Import Group Order

Always follow this order with blank lines between groups:

1. **External packages** (`node_modules/`)
2. **Shared utilities** (`@/shared/`)
3. **Domain** (`@/domain/`)
4. **Application** (`@/application/`)
5. **Infrastructure** (`@/infrastructure/`)
6. **Configuration** (`@/config/`)
7. **Local imports** (relative paths)

## Naming Quick Reference

| Category | Pattern | Example |
|----------|---------|---------|
| Files | kebab-case with suffix | `analyze-market.usecase.ts` |
| Classes | PascalCase | `AnalyzeMarketUseCase` |
| Variables | camelCase | `analyzeMarketUseCase` |
| Constants | UPPER_SNAKE_CASE | `MAX_TICKER_SYMBOLS` |
| Interfaces | PascalCase, I prefix | `IMarketDataAdapter` |
| Directories | kebab-case, plural if multiple | `use-cases`, `adapters` |

## Tsconfig Path Alias

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

This allows `import { X } from '@/application/...'` from any file.

## File Organization Template

```
src/layer/feature/
├── index.ts                      # Re-exports
├── feature.type.ts               # Main implementation
└── feature.helper.ts             # (optional) only if truly helper logic
```

Never use: `index.ts`, `*.helper.ts`, `*.util.ts` without proper layer context.

## Type Definition Organization

- **Domain types** → `src/domain/entities/index.ts`
- **Application types** → `src/application/dto/index.ts`
- **Contract types** → `src/application/contracts/`
- **Shared types** → `src/shared/index.ts` or `src/shared/<concern>/index.ts`

## Comment Examples

```typescript
// Bad: No value
// TODO: fix this

// Good: Clear intention
// TODO: Handle Yahoo Finance rate limiting (API returns 429 after 2000 req/hr)

// Bad: Over-commenting obvious code
const x = y + 1; // Add one to y

// Good: Explains "why", not "what"
// Increment by 1 because API indices are 1-based (starts at 1, not 0)
const apiIndex = dbIndex + 1;
```

## Module Re-export Patterns

```typescript
// src/application/use-cases/ticker/index.ts
export { AnalyzeMarketUseCase } from './analyze-market.usecase';
export { AddTickerUseCase } from './add-ticker.usecase';
export { GetSubscribedTickersUseCase } from './get-subscribed-tickers.usecase';

// Usage
import { AnalyzeMarketUseCase } from '@/application/use-cases/ticker';
```

This is cleaner than:
```typescript
import { AnalyzeMarketUseCase } from '@/application/use-cases/ticker/analyze-market.usecase';
```

## Directory Naming Rules

| Situation | Singular | Plural | Example |
|-----------|----------|--------|---------|
| Conceptual layer | Yes | — | `domain`, `application` |
| Multiple items of same type | — | Yes | `use-cases`, `entities`, `adapters` |
| External services | — | Yes | `external` |
| Single service in external | Yes | — | `yahoo/`, `github/` |
| Database related | — | Yes | `persistence` |
| Config/bootstrap | Yes | — | `config`, `bootstrap` |

## Convention Checklist

- [ ] All TypeScript files use `.ts` (not `.js`)
- [ ] All files use kebab-case (lowercase, hyphens)
- [ ] All classes use PascalCase
- [ ] All variables use camelCase
- [ ] Suffixes match file type (`.usecase.ts`, `.entity.ts`, etc.)
- [ ] Interfaces start with `I` (e.g., `IMarketDataAdapter`)
- [ ] Imports grouped in correct order
- [ ] No `@/` imports from `interfaces/` in `domain/` or `application/`
- [ ] No circular imports
- [ ] One class per file (rare exceptions for related DTOs)
