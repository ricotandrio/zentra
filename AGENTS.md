# Zentra Agents & Skills

> AI agent guide for Zentra codebase. Reference this before coding.

---

## Prime Rule

**Always identify and read relevant skills in `.claude/skills/*.md` before writing code.**

---

## Core Constraints

**Layer Dependencies**
- ❌ Domain imports anything external
- ❌ Application imports infrastructure implementations or interfaces
- ❌ Infrastructure imports interfaces
- ✅ Everything depends inward (Interfaces → Application → Domain, Infrastructure implements Domain)

**File Organization**
- One class per file
- Filenames: `*.usecase.ts`, `*.entity.ts`, `*.adapter.ts`, `*.repository.ts`, `*.contract.ts`, `*.service.ts`, `*.job.ts`, `*.scheduler.ts`, `*.command.ts`, `*.controller.ts`, `*.dto.ts`
- Use kebab-case, no helpers/managers/actions
- Path aliases: `@/` prefix always

**Imports**
- External packages → Shared → Domain → Application → Infrastructure → Config → Local
- Never import `interfaces/` in `application/` or `domain/`
- Never import infrastructure implementations in `application/`

**Business Logic Location**
- Use cases: `application/use-cases/<feature>/`
- Entities: `domain/entities/`
- Adapters: `infrastructure/external/<service>/`
- Contracts: `application/contracts/`
- Handlers/Commands: `interfaces/bot/`, `interfaces/api/`, `interfaces/worker/`

**External Integrations**
- Define port in `application/contracts/`
- Implement adapter in `infrastructure/external/<service>/`
- Inject contract into use case, never implementation
- Map external errors to domain errors in adapter

---

## Skills Reference

| Skill | Purpose | When to Use |
|-------|---------|------------|
| `./claude/skills/clean-architecture-pattern.md` | Dependency flow, layer invariants, anti-patterns | Adding new layers or confused about architecture |
| `./claude/skills/layer-placement.md` | Where code goes, decision tree, common scenarios | Deciding file location for new feature |
| `./claude/skills/code-organization.md` | Naming conventions, imports, file structure | Creating new files or organizing module |
| `./claude/skills/event-driven-architecture.md` | Event bus, publishing, subscribing, design principles | Building async communication or decopled systems |
| `./claude/skills/external-integrations.md` | Adapter pattern, contracts, error handling | Integrating third-party service or API |
| `./claude/skills/testing-patterns.md` | Unit/integration tests, mocking, coverage goals | Writing or reviewing tests |

---

## Agent Workflow

1. **Understand scope** — Read user request fully
2. **Identify skills** — Which skills from table above apply?
3. **Read skills** — Open `.claude/skills/<skill>.md` for implementation details
4. **Verify constraints** — Check Core Constraints section above
5. **Code** — Implement following skill guidance
6. **Verify** — Does code follow all constraints and skill patterns?

---

## Ask Before Coding

Stop and ask user when:

- Correct layer is ambiguous
- Feature could fit multiple use cases
- New external dependency needed but no contract exists
- Modifying `domain/` (confirm with user first)
- Adding new interface/entrypoint not in ARCHITECTURE.md
- User intent is unclear

State ambiguity clearly. Do not guess.

---

## What Not To Do

❌ Put business logic in handlers, adapters, or jobs  
❌ Call SDK directly from use cases  
❌ Create circular dependencies  
❌ Call DB from `interfaces/`  
❌ Create god orchestrators  
❌ Assume capabilities beyond [README.md](./README.md)  

---

## Quick Links

- **CLAUDE.md** — [AI behavior rules](./CLAUDE.md)
- **README.md** — [Project overview & setup](./README.md)
- **Skills Directory** — [.claude/skills/](./claude/skills/)
- **Architecture Deep Dive** — [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## .claude/skills Directory

Individual skill files are maintained in `.claude/skills/` for modularity.

| Skill File | Purpose |
|------------|---------|
| `clean-architecture-pattern.md` | Dependency flow, layer invariants, anti-patterns |
| `layer-placement.md` | Decision tree for where new code goes |
| `code-organization.md` | Naming conventions, imports, file structure |
| `event-driven-architecture.md` | Event bus patterns, publishing/subscribing |
| `external-integrations.md` | Adapter pattern, contracts, error handling |
| `testing-patterns.md` | Unit/integration tests, mocking, coverage |

To update a skill: edit the corresponding `.claude/skills/*.md` file directly.
