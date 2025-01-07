# Testing Guide

## Overview

Our project uses Jest as the testing framework, along with additional tools like `jest-mock-extended` for mocking. This guide explains our testing practices based on actual project implementations.

## Test Structure

```
src/
└── modules/
    └── user/
        └── __tests__/
            └── user.service.test.ts    # Service unit tests
```

## Writing Tests

### 1. Basic Test Setup

```typescript
import 'reflect-metadata';
import { Container } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { UserService } from '../user.service';
import { NotFoundError } from '../../common/errors/graphql.error';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock any global dependencies
jest.mock('../../../config/logger');

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
});
```

### 2. Test Cases Structure

Each test suite should follow this structure:

```typescript
describe('methodName', () => {
  it('should describe expected behavior', async () => {
    // Arrange - Setup test data and mocks
    const mockData = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User'
    };
    prisma.user.findUnique.mockResolvedValue(mockData);

    // Act - Execute the method being tested
    const result = await userService.findById(1);

    // Assert - Verify the results
    expect(result).toEqual(mockData);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 }
    });
  });
});
```

### 3. Testing Success Cases

Example of testing a successful operation:

```typescript
it('should return all users', async () => {
  // Arrange
  const mockUsers = [
    { id: 1, email: 'user1@example.com', name: 'User 1' },
    { id: 2, email: 'user2@example.com', name: 'User 2' }
  ];
  prisma.user.findMany.mockResolvedValue(mockUsers);

  // Act
  const result = await userService.findAll();

  // Assert
  expect(result).toEqual(mockUsers);
  expect(prisma.user.findMany).toHaveBeenCalled();
});
```

### 4. Testing Error Cases

Example of testing error scenarios:

```typescript
describe('error handling', () => {
  it('should throw NotFoundError when user does not exist', async () => {
    // Arrange
    const error: any = new Error('Not found');
    error.code = 'P2025';  // Prisma not found error code
    prisma.user.update.mockRejectedValue(error);

    // Act & Assert
    await expect(userService.update(1, { name: 'New Name' }))
      .rejects
      .toThrow(NotFoundError);
  });

  it('should handle database error', async () => {
    // Arrange
    const error = new Error('Database error');
    prisma.user.findMany.mockRejectedValue(error);

    // Act & Assert
    await expect(userService.findAll()).rejects.toThrow(error);
  });
});
```

## Best Practices

### 1. Mock Setup
- Use `jest-mock-extended` for complex dependencies like Prisma
- Mock all external dependencies (database, logger, etc.)
- Clear mocks between tests using `beforeEach`

### 2. Test Organization
- Group related tests using `describe` blocks
- Use clear, descriptive test names
- Follow the Arrange-Act-Assert pattern
- Test both success and error cases

### 3. Testing Data
- Use realistic test data
- Create helper functions for commonly used mock data
- Include all required fields in mock data

### 4. Assertions
- Test both return values and side effects
- Verify that mocked functions are called with correct parameters
- Use appropriate matchers (toEqual, toThrow, etc.)

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test user.service.test.ts

# Run in watch mode
npm test -- --watch
```

## Coverage Requirements

We aim for high test coverage:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

## Common Patterns

### 1. CRUD Operations Testing

Test all basic CRUD operations:
- Create: Test successful creation and validation errors
- Read: Test finding single items and lists
- Update: Test successful updates and handling non-existent items
- Delete: Test successful deletion and handling non-existent items

### 2. Error Handling

Always test these error scenarios:
- Database errors
- Not found errors
- Validation errors
- Authorization errors (if applicable)