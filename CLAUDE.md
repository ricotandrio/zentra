# CLAUDE.md

> This file defines how AI agents must behave when working inside the Zentra codebase.
> Read this file first — before reading any code, before writing any code.

---

## Prime Directive

**Understand before acting.**

Never generate, modify, or delete code based on assumptions. Always read the relevant context first and ask when anything is unclear. A wrong file in the wrong layer is harder to fix than a 30-second clarification.

---

## Before Doing Anything

Read these files in order:

1. [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — layer rules, dependency boundaries, folder structure, naming conventions
2. [`README.md`](./README.md) — what Zentra does today, the stack, and how to extend it

If the task involves a specific domain area (e.g. trading, GitHub, bot), locate the relevant files before touching anything.

---

## Ask Before Acting

Ask the user for clarification when:

- The correct layer for new code is ambiguous
- A feature could fit in more than one use case
- A new external dependency is needed and no contract exists yet
- The task would require modifying `domain/` (this should be rare — confirm it)
- The task would add a new interface or entrypoint not described in `ARCHITECTURE.md`
- The intent of a natural language request is unclear

Do not guess. Do not proceed with "I'll assume X." State the ambiguity and ask.

---

## Code Generation Rules

### Layer placement

- Identify which layer owns the new code before writing a single line
- Use `ARCHITECTURE.md → Layer Reference` as the decision guide
- When in doubt: use cases go in `application/`, external calls go in `infrastructure/`, Discord/HTTP/worker triggers go in `interfaces/`

### Naming

- Always match the existing naming convention: `*.usecase.ts`, `*.entity.ts`, `*.job.ts`, etc.
- Never introduce `*.helper.ts`, `*.manager.ts`, or `*.action.ts`

### Dependencies

- Never import `infrastructure/` from `application/`
- Never import `interfaces/` from `application/` or `domain/`
- Never let `domain/` import anything
- Always go through contracts for LLM and market data calls

### New features

- New bot capability → new use case first, then wire in the orchestrator
- New worker job → new use case first, then create the job file
- New external service → add to `infrastructure/external/`, never call SDK directly from use cases

---

## What Not To Do

- ❌ Do not put business logic in handlers, adapters, or jobs
- ❌ Do not call the DB from `interfaces/`
- ❌ Do not call GitHub directly from bot handlers
- ❌ Do not create contracts for stable dependencies (GitHub, analytics, terminal)
- ❌ Do not create god orchestrators that hold business rules
- ❌ Do not modify `domain/` without confirming with the user first
- ❌ Do not add a new layer, folder pattern, or naming convention not in `ARCHITECTURE.md` without asking

---

## Current Capabilities (as of last update)

Refer to `README.md` for the live feature table. At the time of writing:

- Discord bot — natural language only, no slash commands
- GitHub — issue creation and PR notifications only
- Worker — market summary from Yahoo Finance only
- LLM — Gemini (via `llm.contract.ts`, swappable)

Do not assume any capability beyond what is listed. If a task implies a capability that does not exist yet, ask the user if they want to add it before implementing it.

---

## Adding New Capabilities

Follow the patterns in `README.md → Adding New Features`. The short version:

1. Start with the use case in `application/use-cases/<feature>/`
2. Add infrastructure in `infrastructure/external/<service>/` if needed
3. Wire the interface last (`interfaces/bot/`, `interfaces/worker/`, etc.)
4. Never go bottom-up (don't start from the interface or infrastructure)

---

## When the Answer is Unclear

Say so. Ask one focused question. Wait for the answer.

Do not proceed with a best guess and add a comment saying "you may want to change this." The architecture has clear rules — if the rules don't cover the case, that's a conversation to have before writing code.
