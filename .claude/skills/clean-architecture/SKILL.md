---
name: clean-architecture
description: Understand Zentra's clean architecture layers and dependency flow (inward only). Use when confused about dependencies, architecture violations, or to learn layer invariants and anti-patterns.
user-invocable: true
disable-model-invocation: false
---

# Clean Architecture Pattern

Core architectural principle for all Zentra code.

## The Dependency Flow

Dependencies must flow **inward only**:

```
Interfaces (Discord, API, Worker)
       ↓
   Application (Use Cases)
       ↓
      Domain (Entities, Services)
       ↑
Infrastructure (External APIs, DB, Adapters)
```

**Critical Rule**: Domain has ZERO external dependencies. Never break this.

## Layer Invariants

| Layer | Can Import | Cannot Import |
|-------|------------|---------------|
| **Domain** | `domain/`, `shared/` | Everything else |
| **Application** | `domain/`, `shared/`, `application/` | `infrastructure/`, `interfaces/` |
| **Infrastructure** | All except `interfaces/` | `interfaces/` |
| **Interfaces** | Everything | Nothing (it's the entry point) |
| **Shared** | `shared/` only | `domain/`, `application/`, `infrastructure/`, `interfaces/` |

## Anti-Patterns to Avoid

❌ **Circular dependencies** — If A imports B and B imports A, you have a design problem.  
❌ **Infrastructure in Application** — Application must use ports (interfaces), not implementations.  
❌ **Business logic in Handlers** — Move it to a use case.  
❌ **Direct SDK calls** — Always wrap in adapters.  
❌ **Domain depending on Framework** — Domain is pure logic.

## When This Matters

- **Easy testing**: Mock layers independently.
- **Easy replacement**: Swap implementations without touching business logic.
- **Maintainability**: Clear responsibility boundaries.
- **Scaling**: Add new interfaces (CLI, Slack, mobile API) without chaos.

## Learn More

- See [reference.md](reference.md) for complete layer invariants and detailed rules
- See [anti-patterns.md](anti-patterns.md) for common violations and how to fix them
- See [diagrams/](diagrams/) for ASCII architecture diagrams
