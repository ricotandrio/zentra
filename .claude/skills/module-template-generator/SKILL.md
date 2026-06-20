---
name: module-template-generator
description: Generate new modules following clean architecture patterns. Use this skill to scaffold a complete module with domain, application, infrastructure, and test layers.
user-invocable: true
disable-model-invocation: false
---

# Module Template Generator

Scaffold new feature modules following clean architecture patterns. Generates boilerplate structure with contracts, use cases, domain logic, and infrastructure adapters.

## Quick Start

```bash
# Generate a new module
./scripts/generate-module.sh notification

# Generates:
# src/modules/notification/
#   ├── index.ts
#   ├── module.ts
#   ├── domain/
#   │   ├── entities/
#   │   └── services/
#   ├── application/
#   │   ├── contracts/
#   │   ├── dtos/
#   │   └── use-cases/
#   └── infrastructure/
#       ├── adapters/
#       └── repositories/
# 
# tests/unit/modules/notification/
#   ├── domain/
#   ├── application/
#   └── infrastructure/
```

## Module Structure

Each module follows clean architecture layers:

```
src/modules/{moduleName}/
├── index.ts                    # Public exports
├── module.ts                   # Module registration
├── domain/                     # Business logic (no dependencies)
│   ├── entities/              # Business entities
│   │   ├── notification.entity.ts
│   │   └── recipient.entity.ts
│   └── services/              # Domain services
│       └── notification.service.ts
├── application/               # Orchestration & ports
│   ├── contracts/             # Interfaces to infrastructure
│   │   ├── email.port.ts
│   │   └── notification.repository.port.ts
│   ├── dtos/                  # Data transfer objects
│   │   ├── send-notification.dto.ts
│   │   └── notification.response.dto.ts
│   └── use-cases/             # Business use cases
│       ├── send-notification.usecase.ts
│       ├── get-notification.usecase.ts
│       └── list-notifications.usecase.ts
└── infrastructure/            # Implementation details
    ├── adapters/              # Port implementations
    │   ├── email.adapter.ts
    │   └── smtp.adapter.ts
    └── repositories/          # Data access
        └── notification.repository.ts

tests/unit/modules/{moduleName}/
├── domain/
│   └── notification.entity.spec.ts
├── application/
│   ├── send-notification.usecase.spec.ts
│   ├── get-notification.usecase.spec.ts
│   └── list-notifications.usecase.spec.ts
└── infrastructure/
    ├── email.adapter.spec.ts
    └── notification.repository.spec.ts
```
