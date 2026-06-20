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

## Generated Files Explained

### Domain Layer

**Entity** (`domain/entities/{name}.entity.ts`): Pure business object
```typescript
export class Notification {
  readonly id: string;
  readonly createdAt: Date;

  constructor(id?: string, createdAt?: Date) {
    this.id = id ?? generateId();
    this.createdAt = createdAt ?? new Date();
  }

  static create(): Notification {
    return new Notification();
  }
}
```

**Service** (`domain/services/{name}.service.ts`): Domain business logic
```typescript
export class NotificationService {
  canSend(notification: Notification): boolean {
    return notification.recipientId !== null;
  }
}
```

### Application Layer

**Port** (`application/contracts/{name}.port.ts`): Interface to infrastructure
```typescript
export interface ISendEmailPort {
  send(email: string, message: string): Promise<void>;
}
```

**DTO** (`application/dtos/{name}.dto.ts`): Data transfer objects
```typescript
export interface SendNotificationDto {
  recipientEmail: string;
  message: string;
}
```

**Use Case** (`application/use-cases/{name}.usecase.ts`): Business orchestration
```typescript
export class SendNotificationUseCase {
  constructor(
    private emailPort: ISendEmailPort,
    private eventBus: IEventBus,
  ) {}

  async execute(dto: SendNotificationDto): Promise<void> {
    await this.emailPort.send(dto.recipientEmail, dto.message);
    await this.eventBus.publish({
      type: 'notification:sent',
      data: dto,
    });
  }
}
```

### Infrastructure Layer

**Adapter** (`infrastructure/adapters/{name}.adapter.ts`): Port implementation
```typescript
export class SmtpEmailAdapter implements ISendEmailPort {
  async send(email: string, message: string): Promise<void> {
    await this.mailer.send({ to: email, body: message });
  }
}
```

**Repository** (`infrastructure/repositories/{name}.repository.ts`): Data access
```typescript
export class NotificationRepository implements INotificationRepository {
  async save(notification: Notification): Promise<void> {
    await this.db.query('INSERT INTO notifications...');
  }
}
```

### Module Registration

**module.ts**: Wires up the module
```typescript
export interface NotificationModule {
  sendNotificationUseCase: SendNotificationUseCase;
}

export function registerNotificationModule(
  eventBus: IEventBus,
  logger: ILogger,
): NotificationModule {
  const emailAdapter = new SmtpEmailAdapter();
  const sendUseCase = new SendNotificationUseCase(emailAdapter, eventBus);

  return {
    sendNotificationUseCase: sendUseCase,
  };
}
```

**index.ts**: Public exports
```typescript
export { registerNotificationModule, type NotificationModule } from './module';
export { SendNotificationUseCase } from './application/use-cases/send-notification.usecase';
export type { SendNotificationDto } from './application/dtos/send-notification.dto';
```

## After Generation

After running the script, follow these steps:

1. **Remove sample files** — Delete the `sample.*` files, they're just templates
2. **Add your entities** — Create domain entities in `domain/entities/`
3. **Define contracts** — Update `application/contracts/` with your ports
4. **Create use cases** — Implement `application/use-cases/` with business logic
5. **Implement adapters** — Add implementations in `infrastructure/adapters/`
6. **Write tests** — Add test files in `tests/unit/modules/{name}/`
7. **Register module** — Import and call `register{Name}Module()` in `src/bootstrap/main.ts`
8. **Export types** — Update `index.ts` with your public exports

## Command Reference

```bash
# Generate a simple module name
./scripts/generate-module.sh ticket

# Results in src/modules/ticket/

# Generate a hyphenated name (auto-converts to camelCase for files)
./scripts/generate-module.sh ticket-management

# Results in src/modules/ticket-management/
```

## Testing Generated Modules

```bash
# Run all tests for a module
npm test -- tests/unit/modules/notification

# Watch mode for development
npm test -- tests/unit/modules/notification --watch

# Coverage report
npm test -- tests/unit/modules/notification --coverage
```

## See Also

- [Clean Architecture Guide](../clean-architecture/README.md) — Layer structure and rules
- [Event-Driven Patterns](../event-driven-patterns/README.md) — Pub/sub communication
