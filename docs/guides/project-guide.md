# Project Guide

## Project Overview

This is a GraphQL-based API service built with TypeScript, featuring:
- Type-safe development with TypeScript
- GraphQL API with Apollo Server
- Prisma ORM for database operations
- Comprehensive error handling with custom GraphQL error types
- Structured logging system with Winston
- Modular architecture with dependency injection using TypeDI
- Health monitoring system
- Firebase authentication integration
- Environment validation using Zod

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── env.ts       # Environment variables and validation
│   ├── logger.ts    # Winston logger configuration
│   ├── prisma.ts    # Database configuration
│   └── graphql.ts   # GraphQL schema and middleware setup
│
├── modules/         # Feature modules
│   ├── common/     # Shared utilities
│   │   ├── errors/    # Custom GraphQL error types
│   │   └── validators/ # Input validation
│   │
│   └── user/      # User module
│       ├── schema/     # GraphQL schema definitions
│       │   ├── types.ts    # Type definitions
│       │   └── inputs.ts   # Input type definitions
│       ├── resolvers/  # GraphQL resolvers
│       │   ├── queries.ts  # Query resolvers
│       │   └── mutations.ts # Mutation resolvers
│       └── index.ts    # Module entry point
│
├── services/       # Business services
│   └── userService.ts  # User-related business logic
│
├── server/         # Server-related components
│   ├── health/     # Health check module
│   │   ├── controller.ts
│   │   ├── routes.ts
│   │   ├── service.ts
│   │   └── schemas.ts
│   └── lifecycle/  # Server lifecycle management
│       ├── index.ts
│       └── manager.ts
│
├── app.ts          # Express and Apollo Server setup
└── index.ts        # Application entry point
```

## Key Documentation

1. [TypeDoc Guide](./typedoc-guide.md)
   - How to write and maintain code documentation
   - TypeDoc standards and best practices
   - Example documentation formats

2. [Error Handling Guide](./error-handling-guide.md)
   - Custom GraphQL error types (ValidationError, AuthenticationError, etc.)
   - Error handling best practices and service integration
   - Error response format and logging

3. [Logger Guide](./logger-guide.md)
   - Winston logger configuration
   - Log levels (error, warn, info, http, debug)
   - Daily rotating file logs
   - Request logging middleware

4. [Apollo Studio Guide](./apollo-studio-guide.md)
   - GraphQL API documentation
   - Query and mutation examples
   - API testing and monitoring

## Development Guidelines

### 1. Code Organization
- Each feature should be in its own module under `src/modules/`
- Common utilities should go in `src/modules/common/`
- Business logic should be placed in `src/services/`
- Server-specific components should be in `src/server/`
- Configuration should be in `src/config/`
- Database operations should use Prisma ORM
- Use TypeDI for dependency injection

### 2. Type Safety
- Use TypeScript types/interfaces for all data structures
- Leverage GraphQL type generation with type-graphql
- Use Prisma's generated types for database operations
- Ensure type consistency between GraphQL and Prisma schemas
- Use Zod for runtime type validation

### 3. Error Handling
- Use appropriate error types from `@/modules/common/errors`
- Include relevant error details and context
- Log errors with appropriate severity levels
- Handle Prisma-specific errors appropriately
- Format GraphQL errors consistently
- Different error handling for development and production

### 4. Logging
- Use structured logging with Winston
- Choose appropriate log levels
- Avoid logging sensitive information
- Use daily rotating log files
- Include request logging
- Add context to log messages

### 5. Testing
- Write unit tests for services
- Write integration tests for resolvers
- Test error scenarios
- Use test data factories
- Test health check endpoints
- Test GraphQL queries and mutations

## Common Tasks

### 1. Creating a New Module
1. Create a new directory under `src/modules/`
2. Create schema directory with `types.ts` and `inputs.ts`
3. Create resolvers directory with `queries.ts` and `mutations.ts`
4. Create corresponding service in `services` directory
5. Add TypeDoc documentation
6. Write tests
7. Register the module

Example:
```typescript
// src/modules/example/schema/types.ts
@ObjectType()
export class Example {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  @Length(2, 100)
  name: string;
}

// src/services/exampleService.ts
@Service()
export class ExampleService {
  constructor(private prisma: PrismaClient) {}

  async findById(id: number): Promise<Example | null> {
    try {
      return await this.prisma.example.findUnique({
        where: { id }
      });
    } catch (error) {
      logger.error('Failed to find example', { id, error });
      throw error;
    }
  }
}

// src/modules/example/resolvers/queries.ts
@Resolver(Example)
export class ExampleQueries {
  constructor(private service: ExampleService) {}

  @Query(() => Example, { nullable: true })
  async example(@Arg('id', () => Int) id: number) {
    return this.service.findById(id);
  }
}
```

### 2. Adding New API Endpoints
1. Define types in schema/types.ts and inputs.ts
2. Implement service methods using Prisma
3. Create resolver methods
4. Add documentation
5. Write tests
6. Add input validation
7. Implement error handling

### 3. Database Changes
1. Update Prisma schema in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <migration-name>`
3. Update related GraphQL types
4. Update affected services
5. Test database operations
6. Update tests

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

# Start Prisma Studio
npx prisma studio
```

### Production
```bash
# Build project
npm run build

# Start production server
npm start

# Check health status
curl http://localhost:3000/api/v1/health
```

## Best Practices

### 1. Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Keep functions small and focused
- Use TypeDoc comments for documentation
- Use dependency injection
- Follow SOLID principles

### 2. API Design
- Follow GraphQL naming conventions
- Use appropriate HTTP status codes
- Provide meaningful error messages
- Document all API endpoints
- Implement proper validation
- Use GraphQL best practices

### 3. Performance
- Use Prisma's query optimization features
- Implement efficient database indexes
- Use appropriate Prisma relations
- Implement pagination for list queries
- Cache frequently accessed data
- Monitor query performance
- Use connection pooling
- Implement request timeout

### 4. Security
- Validate all inputs using class-validator
- Sanitize outputs
- Use appropriate authentication
- Follow security best practices
- Implement rate limiting
- Use CORS protection
- Secure sensitive data
- Implement proper error messages

## Troubleshooting

### Common Issues

1. **GraphQL Validation Errors**
   - Check input types match schema
   - Verify required fields are provided
   - Check enum values are valid
   - Review class-validator decorators

2. **Database Connection Issues**
   - Verify database credentials
   - Check connection string
   - Ensure database is running
   - Check Prisma client initialization

3. **Authentication Errors**
   - Verify token format
   - Check token expiration
   - Confirm user permissions
   - Check Firebase configuration

### Debugging Tools

1. **Apollo Studio**
   - Test queries and mutations
   - Explore schema
   - Check error responses
   - Monitor performance

2. **Prisma Studio**
   - Inspect database records
   - Test database queries
   - Manage data directly
   - View relationships

3. **Logging**
   - Check error logs in /logs directory
   - Use debug logging
   - Monitor performance metrics
   - Review request logs

## Contributing

1. Follow the branching strategy
2. Write clear commit messages
3. Include tests with changes
4. Update documentation
5. Follow code review process
6. Update changelog

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [TypeDI Documentation](https://github.com/typestack/typedi)
- [Winston Documentation](https://github.com/winstonjs/winston) 