#!/bin/bash

# generate-module.sh
# Generate a new feature module following clean architecture patterns
#
# Usage: ./scripts/generate-module.sh moduleName
#        ./scripts/generate-module.sh notification
#        ./scripts/generate-module.sh market-analysis (converts to marketAnalysis)

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Validate input
if [ -z "$1" ]; then
  echo -e "${RED}Error: Module name required${NC}"
  echo "Usage: $0 <moduleName>"
  echo "Example: $0 notification"
  exit 1
fi

MODULE_NAME="$1"
MODULE_PATH="src/modules/$MODULE_NAME"

# Check if module already exists
if [ -d "$MODULE_PATH" ]; then
  echo -e "${RED}Error: Module '$MODULE_NAME' already exists at $MODULE_PATH${NC}"
  exit 1
fi

echo -e "${BLUE}Creating module: $MODULE_NAME${NC}"
echo "Path: $MODULE_PATH"

# Create directory structure
mkdir -p "$MODULE_PATH/domain/entities"
mkdir -p "$MODULE_PATH/domain/services"
mkdir -p "$MODULE_PATH/application/contracts"
mkdir -p "$MODULE_PATH/application/dtos"
mkdir -p "$MODULE_PATH/application/use-cases"
mkdir -p "$MODULE_PATH/infrastructure/adapters"
mkdir -p "$MODULE_PATH/infrastructure/repositories"
mkdir -p "tests/unit/modules/$MODULE_NAME/domain"
mkdir -p "tests/unit/modules/$MODULE_NAME/application"
mkdir -p "tests/unit/modules/$MODULE_NAME/infrastructure"

echo -e "${GREEN}✓ Directory structure created${NC}"

# Generate domain entity
cat > "$MODULE_PATH/domain/entities/${MODULE_NAME}.entity.ts" << 'EOF'
/**
 * Domain Entity: Replace ENTITY with your entity name
 * 
 * Pure business logic, no external dependencies.
 * Use this for core domain objects.
 */

import { generateId } from '@/shared/utils';

export class Entity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = data.id ?? generateId();
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }

  // Add domain methods here
  // Example:
  // canDelete(): boolean {
  //   return this.deletedAt === null;
  // }

  static create(data: Omit<typeof this, 'id' | 'createdAt' | 'updatedAt'>): Entity {
    return new Entity({ ...data });
  }
}
EOF

echo -e "${GREEN}✓ Domain entity created${NC}"

# Generate application port
cat > "$MODULE_PATH/application/contracts/sample.port.ts" << 'EOF'
/**
 * Application Port: Interface to external service
 * 
 * Define what the application needs from infrastructure.
 * Implement this in the infrastructure layer.
 */

export interface SampleRequest {
  // Add request properties
}

export interface SampleResponse {
  // Add response properties
}

export interface ISamplePort {
  execute(request: SampleRequest): Promise<SampleResponse>;
}
EOF

echo -e "${GREEN}✓ Application port created${NC}"

# Generate DTO
cat > "$MODULE_PATH/application/dtos/sample.dto.ts" << 'EOF'
/**
 * Data Transfer Objects (DTO)
 * 
 * Define input/output schemas for use cases.
 */

export interface SampleInputDto {
  // Add input fields
}

export interface SampleOutputDto {
  // Add output fields
}
EOF

echo -e "${GREEN}✓ Application DTO created${NC}"

# Generate use case
cat > "$MODULE_PATH/application/use-cases/sample.usecase.ts" << 'EOF'
/**
 * Use Case: Business orchestration
 * 
 * - Orchestrates domain logic and infrastructure ports
 * - Pure business logic, independent of frameworks
 * - Can publish events to event bus
 */

import { IEventBus } from '@/shared/event-bus';
import { ILogger } from '@/shared/logger';

export class SampleUseCase {
  constructor(
    private eventBus: IEventBus,
    private logger: ILogger,
  ) {}

  async execute(): Promise<void> {
    this.logger.info('[SampleUseCase] Executing');

    // Business logic here

    // Publish event if needed
    // await this.eventBus.publish({
    //   type: 'module:action:complete',
    //   source: 'api',
    //   timestamp: new Date(),
    //   data: { /* ... */ },
    // });
  }
}
EOF

echo -e "${GREEN}✓ Application use case created${NC}"

# Generate infrastructure adapter
cat > "$MODULE_PATH/infrastructure/adapters/sample.adapter.ts" << 'EOF'
/**
 * Infrastructure Adapter: Port implementation
 * 
 * Implements the port defined in application layer.
 * Can use external libraries, APIs, databases here.
 */

import { ISamplePort, SampleRequest, SampleResponse } from '@/modules/sample/application/contracts/sample.port';

export class SampleAdapter implements ISamplePort {
  async execute(request: SampleRequest): Promise<SampleResponse> {
    // Implement business logic here
    // Use external APIs, databases, etc.
    
    return {
      // Return response
    };
  }
}
EOF

echo -e "${GREEN}✓ Infrastructure adapter created${NC}"

# Generate module registration file
cat > "$MODULE_PATH/module.ts" << 'EOF'
/**
 * Module Registration
 * 
 * Initializes all adapters and use cases.
 * Called during bootstrap to wire up the module.
 */

import { IEventBus } from '@/shared/event-bus';
import { ILogger } from '@/shared/logger';
import { SampleUseCase } from './application/use-cases/sample.usecase';
import { SampleAdapter } from './infrastructure/adapters/sample.adapter';

export interface SampleModule {
  // Export use cases here
  // sampleUseCase: SampleUseCase;
}

export function registerSampleModule(
  eventBus: IEventBus,
  logger: ILogger,
): SampleModule {
  // Initialize adapters
  const sampleAdapter = new SampleAdapter();

  // Initialize use cases
  const sampleUseCase = new SampleUseCase(eventBus, logger);

  return {
    // sampleUseCase,
  };
}
EOF

echo -e "${GREEN}✓ Module registration created${NC}"

# Generate public index
cat > "$MODULE_PATH/index.ts" << 'EOF'
/**
 * Public module exports
 * 
 * Only export what consumers need: use cases and types.
 */

export { registerSampleModule, type SampleModule } from './module';
export { SampleUseCase } from './application/use-cases/sample.usecase';
export type { SampleInputDto, SampleOutputDto } from './application/dtos/sample.dto';
EOF

echo -e "${GREEN}✓ Public exports created${NC}"

# Generate domain test
cat > "tests/unit/modules/$MODULE_NAME/domain/sample.entity.spec.ts" << 'EOF'
import { Entity } from '@/modules/$MODULE_NAME/domain/entities/sample.entity';

describe('Entity', () => {
  it('creates entity with id', () => {
    const entity = Entity.create({});
    expect(entity.id).toBeDefined();
  });

  it('has timestamps', () => {
    const entity = Entity.create({});
    expect(entity.createdAt).toBeDefined();
    expect(entity.updatedAt).toBeDefined();
  });
});
EOF

echo -e "${GREEN}✓ Domain tests created${NC}"

# Generate application test
cat > "tests/unit/modules/$MODULE_NAME/application/sample.usecase.spec.ts" << 'EOF'
import { SampleUseCase } from '@/modules/$MODULE_NAME/application/use-cases/sample.usecase';

describe('SampleUseCase', () => {
  let useCase: SampleUseCase;
  let mockEventBus: any;
  let mockLogger: any;

  beforeEach(() => {
    mockEventBus = { publish: jest.fn() };
    mockLogger = { info: jest.fn(), error: jest.fn() };

    useCase = new SampleUseCase(mockEventBus, mockLogger);
  });

  it('executes without error', async () => {
    await expect(useCase.execute()).resolves.not.toThrow();
  });
});
EOF

echo -e "${GREEN}✓ Application tests created${NC}"

# Generate infrastructure test
cat > "tests/unit/modules/$MODULE_NAME/infrastructure/sample.adapter.spec.ts" << 'EOF'
import { SampleAdapter } from '@/modules/$MODULE_NAME/infrastructure/adapters/sample.adapter';

describe('SampleAdapter', () => {
  let adapter: SampleAdapter;

  beforeEach(() => {
    adapter = new SampleAdapter();
  });

  it('executes without error', async () => {
    const result = await adapter.execute({});
    expect(result).toBeDefined();
  });
});
EOF

echo -e "${GREEN}✓ Infrastructure tests created${NC}"

# Summary
echo ""
echo -e "${BLUE}Module created successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update files in $MODULE_PATH/"
echo "  2. Add domain entities to domain/entities/"
echo "  3. Define application ports in application/contracts/"
echo "  4. Create use cases in application/use-cases/"
echo "  5. Implement adapters in infrastructure/adapters/"
echo "  6. Register module in src/bootstrap/main.ts"
echo "  7. Add event types to src/shared/event-bus/event.types.ts if publishing events"
echo "  8. Run tests: npm test -- tests/unit/modules/$MODULE_NAME"
echo ""
echo -e "${GREEN}✓ Done!${NC}"
