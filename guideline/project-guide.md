# Project Guide

## Project Overview

This is a GraphQL-based API service built with TypeScript, featuring:
- Type-safe development with TypeScript
- GraphQL API with Apollo Server
- Prisma ORM for database operations
- Comprehensive error handling
- Structured logging system
- Modular architecture

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── env.ts       # Environment variables
│   ├── logger.ts    # Logging configuration
│   ├── prisma.ts    # Database configuration
│   └── graphql.ts   # GraphQL configuration
│
├── modules/         # Feature modules
│   ├── common/     # Shared utilities
│   │   ├── errors/    # Error handling
│   │   └── validators/ # Input validation
│   │
│   ├── user/       # User module
│   │   ├── user.schema.ts   # Type definitions
│   │   ├── user.service.ts  # Business logic
│   │   └── user.resolver.ts # GraphQL resolvers
│   │
│   └── health/     # Health check module
│
└── index.ts        # Application entry point
```

## Key Documentation

1. [TypeDoc Guide](./typedoc-guide.md)
   - How to write and maintain code documentation
   - TypeDoc standards and best practices

2. [Error Handling Guide](./error-handling-guide.md)
   - Error types and their usage
   - Error handling best practices
   - Error response format

3. [Logger Guide](./logger-guide.md)
   - Logging levels and their usage
   - Structured logging practices
   - Log file management

4. [Apollo Studio Guide](./apollo-studio-guide.md)
   - GraphQL API documentation
   - Query and mutation examples
   - API testing

## Development Guidelines

### 1. Code Organization
- Each feature should be in its own module under `src/modules/`
- Common utilities should go in `src/modules/common/`
- Configuration should be in `src/config/`

### 2. Type Safety
- Use TypeScript types/interfaces for all data structures
- Leverage GraphQL type generation
- Use Prisma's generated types for database operations

### 3. Error Handling
- Use appropriate error types from `@/modules/common/errors`
- Include relevant error details and context
- Log errors with appropriate severity levels

### 4. Logging
- Use structured logging with context
- Choose appropriate log levels
- Avoid logging sensitive information

### 5. Testing
- Write unit tests for services
- Write integration tests for resolvers
- Test error scenarios
- Use test data factories

## Common Tasks

### 1. Creating a New Module
1. Create a new directory under `src/modules/`
2. Create schema, service, and resolver files
3. Add TypeDoc documentation
4. Write tests
5. Register the module

Example:
```typescript
// src/modules/example/example.schema.ts
@ObjectType()
export class Example {
  @Field(() => ID)
  id: number;
}

// src/modules/example/example.service.ts
@Service()
export class ExampleService {
  constructor(private prisma: PrismaClient) {}
}

// src/modules/example/example.resolver.ts
@Resolver(Example)
export class ExampleResolver {
  constructor(private service: ExampleService) {}
}
```

### 2. Adding New API Endpoints
1. Define types in schema file
2. Implement service methods
3. Create resolver methods
4. Add documentation
5. Write tests

### 3. Database Changes
1. Update Prisma schema
2. Run migrations
3. Update related TypeScript types
4. Update affected services

## Environment Setup

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Generate documentation
npm run docs
```

### Production
```bash
# Build project
npm run build

# Start production server
npm start
```

## Best Practices

### 1. Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Keep functions small and focused
- Use TypeDoc comments for documentation

### 2. API Design
- Follow GraphQL naming conventions
- Use appropriate HTTP status codes
- Provide meaningful error messages
- Document all API endpoints

### 3. Performance
- Use database indexes appropriately
- Implement pagination for list queries
- Cache frequently accessed data
- Monitor query performance

### 4. Security
- Validate all inputs
- Sanitize outputs
- Use appropriate authentication
- Follow security best practices

## Troubleshooting

### Common Issues

1. **GraphQL Validation Errors**
   - Check input types match schema
   - Verify required fields are provided
   - Check enum values are valid

2. **Database Connection Issues**
   - Verify database credentials
   - Check connection string
   - Ensure database is running

3. **Authentication Errors**
   - Verify token format
   - Check token expiration
   - Confirm user permissions

### Debugging Tools

1. **Apollo Studio**
   - Test queries and mutations
   - Explore schema
   - Check error responses

2. **Logging**
   - Check error logs
   - Use debug logging
   - Monitor performance metrics

3. **Database**
   - Use Prisma Studio
   - Check migrations
   - Monitor queries

## Contributing

1. Follow the branching strategy
2. Write clear commit messages
3. Include tests with changes
4. Update documentation
5. Follow code review process

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/) 