# Dependency Injection Guide

## Overview

Our project uses TypeDI for dependency injection, integrated with GraphQL and Prisma. This guide explains our actual implementation of dependency injection.

## Project Structure

```
src/
├── config/
│   ├── prisma.ts         # Prisma client setup and injection
│   └── graphql.ts        # GraphQL schema setup with TypeDI
├── modules/
│   ├── user/
│   │   ├── user.service.ts
│   │   ├── user.resolver.ts
│   │   └── __tests__/
│   └── common/
│       └── errors/
│           └── error.service.ts
```

## Basic Setup

### 1. Prisma Client Registration

```typescript
// src/config/prisma.ts
import { PrismaClient } from '@prisma/client';
import { Container } from 'typedi';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

Container.set(PrismaClient, prisma);

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
```

### 2. GraphQL Integration

```typescript
// src/config/graphql.ts
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';
import { UserResolver } from '../modules/user';

export const createSchema = async () => {
  return buildSchema({
    resolvers: [UserResolver],
    container: Container,
    validate: { forbidUnknownValues: false },
    emitSchemaFile: process.env.NODE_ENV !== 'production',
  });
};
```

## Service Implementation

### Service with Dependencies

```typescript
// src/modules/user/user.service.ts
import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';

@Service()
export class UserService {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<User[]> {
    try {
      logger.debug('Fetching all users');
      const users = await this.prisma.user.findMany();
      logger.info('Successfully fetched all users', { count: users.length });
      return users;
    } catch (error: any) {
      logger.error('Failed to fetch users', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
```

### GraphQL Resolver with Service Injection

```typescript
// src/modules/user/user.resolver.ts
import { Resolver, Query } from 'type-graphql';
import { Service } from 'typedi';

@Service()
@Resolver(User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  async users(): Promise<User[]> {
    return this.userService.findAll();
  }
}
```

## Error Handling Service

```typescript
// src/modules/common/errors/error.service.ts
@Service()
export class ErrorService {
  handleUncaughtException(error: Error): void {
    logger.error('Uncaught Exception:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      processId: process.pid,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    });
  }

  formatError(error: GraphQLError): GraphQLError {
    logger.error('GraphQL Error:', {
      message: error.message,
      path: error.path,
      locations: error.locations,
      extensions: error.extensions,
    });

    if (error instanceof GraphQLError && error.extensions?.code) {
      return error;
    }

    return new InternalError(
      process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message
    );
  }
}
```

## Testing with Dependency Injection

### Service Tests

```typescript
// src/modules/user/__tests__/user.service.test.ts
import { Container } from 'typedi';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('UserService', () => {
  let userService: UserService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeAll(() => {
    // Mock Prisma client
    prisma = mockDeep<PrismaClient>();
    Container.set(PrismaClient, prisma);
    userService = Container.get(UserService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find all users', async () => {
    const mockUsers = [
      { id: 1, email: 'user1@example.com', name: 'User 1' },
      { id: 2, email: 'user2@example.com', name: 'User 2' }
    ];
    prisma.user.findMany.mockResolvedValue(mockUsers);

    const result = await userService.findAll();

    expect(result).toEqual(mockUsers);
    expect(prisma.user.findMany).toHaveBeenCalled();
  });
});
```

## Application Bootstrap

```typescript
// src/index.ts
import 'reflect-metadata';
import { Container } from 'typedi';
import { ErrorService } from './modules/common/errors/error.service';

async function bootstrap() {
  try {
    const app = await createApp();
    const errorService = Container.get(ErrorService);

    process.on('uncaughtException', (error) => {
      errorService.handleUncaughtException(error);
      process.exit(1);
    });

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${env.PORT}`);
    });

    // Setup signal handlers
    const processService = Container.get(ProcessService);
    processService.setupSignalHandlers(server);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}
```

## Best Practices

1. Service Registration:
   - Use `@Service()` decorator for all injectable classes
   - Register third-party services in appropriate config files
   - Handle cleanup in beforeExit handlers

2. Error Handling:
   - Use dedicated ErrorService for centralized error handling
   - Convert errors appropriately for GraphQL responses
   - Include proper logging in error handlers

3. Testing:
   - Use `jest-mock-extended` for mocking complex dependencies
   - Reset Container between tests when necessary
   - Mock external services appropriately

4. GraphQL Integration:
   - Use TypeDI container in schema building
   - Inject services into resolvers
   - Handle errors through ErrorService 
   ``` 