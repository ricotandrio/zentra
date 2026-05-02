# Layer Placement Skill

> **How to decide where new code goes**

## Quick Decision Tree

```
Is it a business rule?
├─ YES → Use Case in application/use-cases/<feature>/
└─ NO → External work?
    ├─ YES → Infrastructure adapter
    └─ NO → Shared utility

Is it an entrypoint (Discord slash command, HTTP route, job)?
├─ YES → interfaces/<type>/ (bot/, api/, worker/)
└─ NO → See above

Does it call an external service (GitHub, OpenAI, Yahoo Finance)?
├─ YES → infrastructure/external/<service>/
└─ NO → Application or Domain
```

## Common Scenarios

### "I need to add a new bot command"

1. **If it's a new capability** → Create a use case first
   - File: `src/application/use-cases/<feature>/<feature>.usecase.ts`
   - Then wire it into `src/interfaces/bot/commands/`

2. **If it uses existing logic** → Add command that calls existing use case
   - File: `src/interfaces/bot/commands/<command>.command.ts`

### "I need to integrate a new external API"

1. Create adapter in `src/infrastructure/external/<service>/`
2. Define a contract (port) in `src/application/contracts/`
3. Use the contract in application layer
4. Swap implementations without touching use cases

### "I need to add a new database entity"

1. Create entity in `src/domain/entities/`
2. Create repository interface in `src/domain/repositories/`
3. Implement repository in `src/infrastructure/persistence/`
4. Use repository in use cases

### "I need to fix a bug in market analysis"

1. Check if bug is in use case → Fix in `src/application/use-cases/ticker/`
2. Check if bug is in job → Fix in `src/interfaces/worker/jobs/`
3. Check if bug is in infrastructure → Fix in `src/infrastructure/external/yahoo/`

## Naming Convention

Once you know the layer, follow these patterns:

- **Use Cases**: `*.usecase.ts` (e.g., `analyze-market.usecase.ts`)
- **Entities**: `*.entity.ts` (e.g., `ticker.entity.ts`)
- **Adapters**: `*.adapter.ts` (e.g., `github.adapter.ts`)
- **Repositories**: `*.repository.ts` (e.g., `ticker.repository.ts`)
- **Jobs**: `*.job.ts` (e.g., `market-analysis.job.ts`)
- **Schedulers**: `*.scheduler.ts` (e.g., `market-analysis.scheduler.ts`)
- **Services**: `*.service.ts` (only in domain)
- **Commands**: `*.command.ts` (bot commands)
- **Controllers**: `*.controller.ts` (API controllers)
- **Routes**: `*.ts` (no prefix, e.g., `health.ts`)

❌ **Never use**: `*.helper.ts`, `*.manager.ts`, `*.action.ts`, `*.util.ts` (use shared/ instead)

## When in Doubt

Ask in CLAUDE.md → "Ask Before Acting" section. State the ambiguity clearly.
