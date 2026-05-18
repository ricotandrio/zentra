# AGENTS.md

## Purpose

This repository uses AI agents as engineering assistants, not autonomous owners of the codebase.

Agents should:
- help implement scoped tasks
- validate architecture consistency
- review changes
- reduce repetitive work
- improve documentation quality
- assist debugging and refactoring

Agents should NOT:
- redesign the entire project without request
- introduce major dependencies automatically
- rewrite unrelated files
- perform broad refactors without approval

---

## Agent Workflow

Before making changes:
1. Understand the task scope
2. Read related files first
3. Minimize unrelated modifications
4. Prefer consistency with existing patterns
5. Explain risky decisions before applying them

---

## Repository Principles

- Keep code simple and maintainable
- Prefer explicit code over abstraction
- Avoid premature optimization
- Avoid unnecessary dependencies
- Keep architecture modular
- Preserve current project conventions

---

## Validation Responsibilities

Agents should validate:
- naming consistency
- architecture consistency
- duplicated logic
- unnecessary complexity
- dead code
- missing error handling
- missing documentation
- unsafe assumptions

Agents may suggest improvements, but should not apply large architectural changes automatically.

---

## Allowed Autonomous Actions

Agents may:
- fix scoped bugs
- improve documentation
- refactor small isolated code
- add tests
- improve type safety
- clean obvious duplication
- improve readability

---

## Actions Requiring Confirmation

Ask before:
- changing architecture
- adding dependencies
- deleting files
- renaming public APIs
- modifying infrastructure
- changing database schema
- changing CI/CD
- performing large refactors

---

## Coding Expectations

- Follow existing project structure
- Reuse existing utilities first
- Keep functions focused
- Avoid hidden side effects
- Prefer readability over cleverness

---

## Communication Style

Responses should:
- be concise
- explain tradeoffs clearly
- highlight risks early
- avoid unnecessary verbosity

When uncertain:
- ask clarifying questions instead of guessing

---

## Skills & Architecture References

For detailed patterns, see:
- **ARCHITECTURE.md** — [Layer structure, dependency rules](./docs/ARCHITECTURE.md)
- **Skills Directory** — [`.claude/skills/`](./.claude/skills/) — focused guides:
  - `clean-architecture/` — Layer invariants, anti-patterns
  - `layer-placement/` — Where code goes
  - `code-standards/` — Naming, imports, organization
  - `event-driven-patterns/` — Async communication
  - `external-adapter-pattern/` — Third-party integrations
  - `testing-strategies/` — Test patterns

---

## Goal

The goal is to use AI agents as reliable engineering collaborators for daily development tasks while keeping human control over architecture and product direction.
