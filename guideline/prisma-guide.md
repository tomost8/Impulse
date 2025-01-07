# Prisma Guide

## Overview

Prisma is our ORM (Object-Relational Mapping) tool that integrates tightly with our GraphQL API. This guide explains how to effectively use Prisma in our project.

## Project Structure

```
src/
└── modules/
    └── user/
        ├── user.schema.ts      # GraphQL schema and type definitions
        ├── user.resolver.ts    # GraphQL resolver
        ├── user.service.ts     # Service layer (with Prisma operations)
        └── __tests__/
            └── user.service.test.ts
```

## Schema Definition

Our schema is defined in `prisma/schema.prisma` and needs to be synchronized with GraphQL type definitions:

```prisma
// Prisma schema
model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  firebaseUid String?  @unique
  name        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("users")
}
```

Corresponding GraphQL type definition (`user.schema.ts`):

```typescript
@ObjectType()
export class User {
  @Field(() => Int)
  id!: number;

  @Field(() => String)
  email!: string;

  @Field(() => String, { nullable: true })
  name!: string | null;

  @Field(() => String, { nullable: true })
  firebaseUid!: string | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
```

## Prisma Service Layer Integration

Using Prisma in the Service layer (`user.service.ts`):

```typescript
@Service()
export class UserService {
  constructor(private prisma: PrismaClient) {}

  // Query all users
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

  // Query user by ID
  async findById(id: number): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id }
      });
    } catch (error: any) {
      logger.error('Failed to find user', { userId: id });
      throw error;
    }
  }

  // Create user
  async create(input: CreateUserInput): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: input
      });
    } catch (error: any) {
      logger.error('Failed to create user', { input });
      throw error;
    }
  }

  // Update user
  async update(id: number, input: UpdateUserInput): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: input
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      throw error;
    }
  }

  // Delete user
  async delete(id: number): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      throw error;
    }
  }
}
```

## GraphQL Resolver Integration

Resolver using Prisma through Service layer (`user.resolver.ts`):

```typescript
@Service()
@Resolver(User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  async users(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Query(() => User, { nullable: true })
  async user(@Arg('id', () => Int) id: number): Promise<User | null> {
    return this.userService.findById(id);
  }

  @Mutation(() => User)
  async createUser(@Arg('input') input: CreateUserInput): Promise<User> {
    return this.userService.create(input);
  }

  @Mutation(() => User)
  async updateUser(
    @Arg('id', () => Int) id: number,
    @Arg('input') input: UpdateUserInput
  ): Promise<User> {
    return this.userService.update(id, input);
  }

  @Mutation(() => Boolean)
  async deleteUser(@Arg('id', () => Int) id: number): Promise<boolean> {
    await this.userService.delete(id);
    return true;
  }
}
```

## Error Handling

Converting Prisma errors to GraphQL errors:

```typescript
try {
  await this.prisma.user.update({ /* ... */ });
} catch (error: any) {
  if (error.code === 'P2025') {
    // Record not found error
    throw new NotFoundError(`User not found`);
  }
  if (error.code === 'P2002') {
    // Unique constraint violation
    throw new ValidationError('Email already exists');
  }
  throw error;
}
```

Common Error Codes:
- `P2002`: Unique constraint violation
- `P2025`: Record not found
- `P2003`: Foreign key constraint violation
- `P2014`: Invalid ID value in where condition

## Testing

Using `jest-mock-extended` to mock Prisma Client:

```typescript
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('UserService', () => {
  let userService: UserService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeAll(() => {
    prisma = mockDeep<PrismaClient>();
    Container.set(PrismaClient, prisma);
    userService = Container.get(UserService);
  });

  it('should create user', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User'
    };
    prisma.user.create.mockResolvedValue(mockUser);

    const result = await userService.create({
      email: 'test@example.com',
      name: 'Test User'
    });

    expect(result).toEqual(mockUser);
  });
});
```

## Schema Management

```bash
# Create migration
npx prisma migrate dev --name add_user_fields

# Apply migrations
npx prisma migrate deploy

# Reset database (DANGER: Deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

## Best Practices

1. Layer Structure:
   - Schema Definition (Prisma schema)
   - GraphQL Types (`*.schema.ts`)
   - Service Layer (`*.service.ts`)
   - Resolver Layer (`*.resolver.ts`)

2. Error Handling:
   - Handle Prisma errors in Service layer
   - Convert to appropriate GraphQL errors
   - Use logging for error details

3. Performance Optimization:
   - Use `select` to fetch only needed fields
   - Use `include` carefully for relations
   - Implement pagination for large datasets

4. Testing:
   - Use `jest-mock-extended` to mock Prisma
   - Write unit tests for each Service method
   - Test error handling scenarios 