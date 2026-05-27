# Zentra

Zentra is a personal automation hub with growing collection of tools, automations, and integrations built around a Discord bot interface.

The project is designed to evolve continuously, so the architecture focuses heavily on maintainability, modularity, and low-friction scaling as new capabilities are added over time.

Some modules communicate through an in-memory event bus. The goal of this approach is to reduce coupling between modules while keeping the system operationally simple.

Because Zentra is currently a personal project, multiple modules can safely run within the same process without introducing unnecessary infrastructure complexity. However, the architecture is intentionally designed so modules can later be moved into separate processes with minimal impact on the overall system structure.

## Stack

- **Runtime:** Node.js + TypeScript
- **Interfaces:** Discord Bot, Express API, Web Dev Panel
- **Architecture:** Clean Architecture, Modular Monolith

### Prerequisites

- Node.js 20

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
# For development (with hot reload)
npm run dev

# For deployment
npm run build
npm run start
```