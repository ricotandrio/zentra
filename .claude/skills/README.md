# Zentra Skills

> AI-readable guides for working in the Zentra codebase

## Core Architecture

- [Clean Architecture Pattern](./clean-architecture-pattern.md) — Understand the dependency flow and layer invariants
- [Layer Placement](./layer-placement.md) — Decision tree for where new code goes
- [Code Organization](./code-organization.md) — Naming conventions, import rules, file structure

## Features & Patterns

- [Event-Driven Architecture](./event-driven-architecture.md) — How components communicate via events
- [External Integrations](./external-integrations.md) — Adding new APIs, services, and adapters
- [Testing Patterns](./testing-patterns.md) — Unit, integration, and end-to-end testing strategy

## Reading Order

1. **First time in codebase**: Start with `clean-architecture-pattern.md`
2. **Adding a feature**: Read `layer-placement.md`, then the relevant feature skill
3. **Working with external services**: Read `external-integrations.md`
4. **Writing tests**: Read `testing-patterns.md`
5. **Organizing code**: Read `code-organization.md`

## Quick Reference

| Question | Skill |
|----------|-------|
| Where does X go? | [Layer Placement](./layer-placement.md) |
| How do components talk? | [Event-Driven Architecture](./event-driven-architecture.md) |
| How do I add GitHub integration? | [External Integrations](./external-integrations.md) |
| What are the naming rules? | [Code Organization](./code-organization.md) |
| How do I test this? | [Testing Patterns](./testing-patterns.md) |
| What's the dependency flow? | [Clean Architecture](./clean-architecture-pattern.md) |
