# Zentra

Zentra is a personal automation hub — a growing collection of tools and integrations built around a Discord bot interface. New features and capabilities are added continuously, so the entire codebase is structured to scale without friction.

---

## What it does (currently)

| Feature               | Interface        | Description                                                                  |
| --------------------- | ---------------- | ---------------------------------------------------------------------------- |
| Natural language bot  | Discord          | Talk to Zentra in plain English — LLM routes your intent to the right action |
| GitHub issue creation | Discord → GitHub | Ask the bot to create an issue; it handles the rest                          |
| PR notifications      | GitHub → Discord | Get notified in Discord when a PR is opened                                  |
| Market summary        | Worker (cron)    | Daily Yahoo Finance summary, processed and delivered via LLM                 |

---

## Stack

- **Runtime:** Node.js + TypeScript
- **Bot:** Discord.js
- **LLM:** Gemini (via contract — swappable)
- **Market data:** Yahoo Finance (via contract — swappable)
- **GitHub:** Octokit
- **Architecture:** Clean Architecture, Modular Monolith

---

## Project Structure

```
src/
├── bootstrap/        # App startup, dependency injection
├── domain/           # Core business rules — pure TypeScript, no dependencies
├── application/      # Use cases, contracts, orchestrators
├── infrastructure/   # DB, external APIs (GitHub, LLM, Yahoo)
├── interfaces/
│   ├── bot/          # Discord natural language handler
│   ├── api/          # HTTP API
│   └── worker/       # Cron jobs (market summary)
├── shared/           # Logger, errors, utils
└── config/           # Env and provider config
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for full layer rules, dependency boundaries, and naming conventions.

---

## Getting Started

### Prerequisites

- Node 20
- A Discord bot token
- Gemini API key
- GitHub personal access token

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### Run

```bash
# Discord bot
npm run start:bot

# HTTP API
npm run start:api

# Worker (cron jobs)
npm run start:worker
```

---

## Adding New Features

Zentra is built to grow. The structure is intentionally layered so adding a new feature never requires touching unrelated parts of the system.

**Adding a new bot capability:**

1. Add a use case in `application/use-cases/<feature>/`
2. Register any new external services in `infrastructure/external/`
3. The LLM orchestrator in `application/orchestrators/` will route to it — update intent mapping there

**Adding a new worker job:**

1. Create a job file in `interfaces/worker/jobs/<name>.job.ts`
2. Create the use case it calls in `application/use-cases/`
3. Register the schedule in `interfaces/worker/schedulers/`

**Adding a new interface (e.g. CLI, webhook):**

1. Add it under `interfaces/<name>/`
2. Call existing use cases — no domain or application changes needed

---

## Architecture Principle

> A new feature should only require adding files, not modifying existing layers.

Dependencies flow inward: `Interfaces → Application → Domain`. Infrastructure implements domain contracts. Nothing in domain knows about the outside world.
