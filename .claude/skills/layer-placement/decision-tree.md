# Layer Placement Decision Tree

Complete flowchart for code placement decisions.

## Decision Flow

```
START: I'm adding code
  │
  ├─ Is it a domain concept, entity, or business rule?
  │  ├─ YES
  │  │  ├─ Is it an entity (represents data)?
  │  │  │  ├─ YES → src/domain/entities/<entity>.entity.ts
  │  │  │  │
  │  │  │  └─ NO: Is it a service (encapsulates logic)?
  │  │  │     ├─ YES → src/domain/services/<service>.service.ts
  │  │  │     │
  │  │  │     └─ NO → src/domain/ somewhere
  │  │  │
  │  │  └─ Is it a repository interface (persistence port)?
  │  │     ├─ YES → src/domain/repositories/<entity>.repository.ts
  │  │     │        (Note: implementation goes in infrastructure)
  │  │     │
  │  │     └─ NO → Regular domain logic
  │  │
  │  └─ NO: Continue...
  │
  ├─ Is it a use case or orchestration of business rules?
  │  ├─ YES → src/application/use-cases/<feature>/<feature>.usecase.ts
  │  │
  │  └─ NO: Continue...
  │
  ├─ Is it a port/contract definition?
  │  ├─ YES → src/application/contracts/<service>.contract.ts
  │  │
  │  └─ NO: Continue...
  │
  ├─ Is it a DTO or response object?
  │  ├─ YES → src/application/dto/<name>.dto.ts
  │  │
  │  └─ NO: Continue...
  │
  ├─ Is it an entrypoint (Discord, HTTP, job)?
  │  ├─ Discord slash command?
  │  │  └─ src/interfaces/bot/commands/<command>.command.ts
  │  │
  │  ├─ HTTP route or controller?
  │  │  ├─ Route → src/interfaces/api/routes/<resource>.ts
  │  │  └─ Controller → src/interfaces/api/controllers/<resource>.controller.ts
  │  │
  │  ├─ Background job?
  │  │  └─ src/interfaces/worker/jobs/<job>.job.ts
  │  │
  │  ├─ Job scheduler?
  │  │  └─ src/interfaces/worker/schedulers/<scheduler>.scheduler.ts
  │  │
  │  └─ Event subscriber/handler?
  │     └─ src/interfaces/<layer>/subscribers/<event>.handler.ts
  │
  ├─ Is it an external service adapter?
  │  ├─ YES
  │  │  ├─ First: Define contract → src/application/contracts/<service>.contract.ts
  │  │  ├─ Then: Implement adapter → src/infrastructure/external/<service>/<service>.adapter.ts
  │  │  └─ Wire in bootstrap
  │  │
  │  └─ NO: Continue...
  │
  ├─ Is it a repository implementation?
  │  ├─ YES → src/infrastructure/persistence/<entity>.repository.ts
  │  │        (implements interface from src/domain/repositories/)
  │  │
  │  └─ NO: Continue...
  │
  ├─ Is it a cross-cutting concern (logger, validator, error)?
  │  ├─ YES → src/shared/<concern>/
  │  │
  │  └─ NO: Continue...
  │
  └─ Is it configuration or bootstrapping?
     ├─ YES
     │  ├─ Config → src/config/
     │  └─ Bootstrap → src/bootstrap/
     │
     └─ NO: You might have made a mistake. Review clean-architecture skill.
```

## Quick Lookup Table

| Question | Answer | Location |
|----------|--------|----------|
| "What is this?" | Entity | `src/domain/entities/<name>.entity.ts` |
| | Service (domain) | `src/domain/services/<name>.service.ts` |
| | Repository interface | `src/domain/repositories/<name>.repository.ts` |
| | Use case | `src/application/use-cases/<feature>/<action>.usecase.ts` |
| | Contract/port | `src/application/contracts/<name>.contract.ts` |
| | DTO | `src/application/dto/<name>.dto.ts` |
| | Discord command | `src/interfaces/bot/commands/<name>.command.ts` |
| | API route | `src/interfaces/api/routes/<name>.ts` |
| | API controller | `src/interfaces/api/controllers/<name>.controller.ts` |
| | Background job | `src/interfaces/worker/jobs/<name>.job.ts` |
| | Scheduler | `src/interfaces/worker/schedulers/<name>.scheduler.ts` |
| | Event handler | `src/interfaces/<layer>/subscribers/<name>.handler.ts` |
| | External adapter | `src/infrastructure/external/<service>/<service>.adapter.ts` |
| | Repository impl | `src/infrastructure/persistence/<entity>.repository.ts` |
| | Logger, validator | `src/shared/<concern>/` |
| | Config | `src/config/` |
| | Bootstrap/wiring | `src/bootstrap/` |

---

## Layer Depth Chart

How "deep" is each layer (lower = more fundamental, less specific):

```
Least Specific (Most General)
│
├─ Shared (fundamental utilities)
├─ Domain (business logic, independent of framework)
├─ Infrastructure (implementations, external services)
├─ Application (use cases, ports)
└─ Interfaces (entrypoints, specific to Discord/HTTP/Jobs)

Most Specific (Least General)
```

**Rule**: When in doubt, move code to a deeper layer (more general).

---

## Common Transitions

If you find yourself in Layer X but the code "feels" like it belongs elsewhere:

| Current | Feels Like | Move To | Reason |
|---------|-----------|---------|--------|
| Command (Bot) | Business logic | Use case | Commands shouldn't decide; use cases should |
| Repository | External calls | Adapter | Repo is persistence, not external services |
| Entity | Behavior | Service (domain) | Entities are data, services encapsulate logic |
| Use case | Infrastructure details | Application layer | Extract as contract, implement in infrastructure |
| Adapter | Delivery (Discord) | Interfaces | Adapters are independent, delivery is orchestration |

---

## Signs You're in the Wrong Layer

| Sign | Likely Problem | Fix |
|------|---|---|
| Use case calls `new YahooAdapter()` | Infrastructure in application | Create adapter in infrastructure, inject contract |
| Entity has `async save()` | Data is doing persistence | Move to repository |
| Command has `if-else` business logic | Logic in interface | Extract to use case |
| Repository calls external API | Persistence is external service | Use adapter instead |
| Domain imports `infrastructure/` | Wrong direction | Domain should never import outward |
| Two layers importing each other | Circular dependency | Introduce event bus or third layer |
| Handler calls Discord directly from adapter | Infrastructure knows about interfaces | Let interfaces orchestrate |

---

## Pro Tips

1. **Test layer placement**: If you need the entire framework to test it, move it up a layer
2. **Dependency direction**: Imports should go inward/downward, never outward
3. **When confused**: Go deeper (choose Shared > Infrastructure > Application > Interfaces)
4. **Naming signals**: The suffix (`.usecase.ts`, `.entity.ts`) tells you the layer
5. **Bootstrap is the boss**: Only bootstrap should see all layers
