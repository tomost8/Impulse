# Impulse Development Guide

This guide provides development workflows, code standards, and best practices for developers working on the Impulse backend project.


## Project Architecture

Impulse follows a modular architecture based on Domain-Driven Design (DDD) principles for organizing code:

```
src/
├── modules/    # Domain modules, one module per functional area
│   ├── user/
│   ├── post/
│   └── ...
├── services/   # Business logic services
├── config/     # Configuration files
└── middleware/ # Express middleware
```

### Module Structure

Each functional module typically contains the following structure:

```
modules/<module-name>/
├── resolvers/  # GraphQL resolvers
│   ├── <Module>Queries.ts
│   ├── <Module>Mutations.ts
│   └── <Module>Subscriptions.ts
├── schema/     # GraphQL type definitions
│   └── <module>Types.ts
└── index.ts    # Module exports
```

## Development Workflow

### Feature Development Process

1. **Branch Management**

Create a branch for each new feature:
```bash
git checkout -b feature/<feature-name>
```

2. **Develop New Features**

   a. Add data models in Prisma schema (if needed)
   b. Create GraphQL type definitions
   c. Implement service layer logic
   d. Create GraphQL resolvers
   e. Write tests

3. **Run Tests**

```bash
npm test
```

4. **Commit Code**

```bash
git add .
git commit -m "feat: add <feature-description>"
git push origin feature/<feature-name>
```

5. **Create Pull Request**

Create a Pull Request on the code repository platform, detailing the implemented functionality and any necessary context.

### Database Migrations

When database model modifications are needed:

1. Update the `prisma/schema.prisma` file
2. Generate migration
```bash
npx prisma migrate dev --name <migration-name>
```
3. Review the generated migration file
4. Apply migration
```bash
npx prisma migrate deploy
```

## Code Standards

### TypeScript Standards

- Use static typing, avoid using `any`
- Use interfaces to define data structures whenever possible
- Use async/await for handling asynchronous operations

### GraphQL Standards

#### Type Definitions

- Use Type-GraphQL decorators to define GraphQL types
- All types should have clear comments
- Provide explicit type definitions for all fields

```typescript
@ObjectType()
class User {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field({ nullable: true })
  profile_picture?: string;
}
```

#### Resolvers

- Each resolver method should have detailed JSDoc comments
- Use specialized input types for data validation
- Always return standard responses containing `success` and `errors` fields

```typescript
@Query(() => UserResponse)
async user(@Arg('id') id: number): Promise<UserResponse> {
  try {
    const user = await this.userService.findById(id);
    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'id',
        message: error.message
      }]
    };
  }
}
```

### Service Layer Standards

- Business logic should be placed in the service layer, not in resolvers
- Use dependency injection to manage service dependencies
- Each method should have a single responsibility
- Method names should clearly express their functionality

```typescript
@Service()
class UserService {
  constructor(
    private prisma: PrismaClient,
    private logger: LoggerService
  ) {}

  async findById(id: number): Promise<User> {
    this.logger.info(`Looking up user with ID: ${id}`);
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

## Error Handling Best Practices

### Centralized Error Handling

- Use `ErrorService` to handle all GraphQL errors
- For HTTP APIs, use global error middleware
- Log all errors but only expose safe error information to clients

### Standard Error Responses

Always use standard error format:

```typescript
{
  success: false,
  errors: [
    {
      field: string;  // Field related to the error
      message: string; // User-friendly error message
    }
  ]
}
```

## Performance Optimization

### Database Query Optimization

- Use Prisma's `include` to solve N+1 problems
- Create database indexes for frequently queried fields
- Use pagination for complex queries to reduce response time

### Caching Strategy

- Use Redis to cache frequently accessed data
- Use appropriate TTL (Time To Live) to prevent cache expiration
- Implement cache invalidation mechanisms

## Logging

- Use Winston for structured logging
- Use appropriate log levels (debug, info, warn, error)
- Do not log sensitive data

```typescript
// Correct logging
logger.info('User login successful', { userId: user.id });

// Incorrect logging - do not log passwords or tokens
logger.info('Auth attempt', { email: 'user@example.com', password: 'secret' });
```

## Testing Strategy

### Unit Testing

Use Jest to write unit tests for services and resolvers:

```typescript
describe('UserService', () => {
  it('should find user by ID', async () => {
    const mockPrisma = { user: { findUnique: jest.fn() } };
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, name: 'Test' });
    
    const service = new UserService(mockPrisma as any);
    const result = await service.findById(1);
    
    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(mockPrisma.user.findUnique).toBeCalledWith({ where: { id: 1 } });
  });
});
```

### Integration Testing

Create integration tests for API endpoints:

```typescript
describe('User API', () => {
  it('should return user by ID', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          query {
            user(id: 1) {
              success
              user {
                id
                email
              }
            }
          }
        `
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.user.success).toBe(true);
    expect(response.body.data.user.user.id).toBe(1);
  });
});
```

## Security Best Practices

### Authentication and Authorization

- Use Firebase authentication for user login
- Implement role-based access control
- Use middleware to check permissions for each request

### Data Validation

- Use Class Validator or Zod to validate all inputs
- Implement request rate limiting to prevent brute force attacks
- Use Helmet to set secure HTTP headers

### Sensitive Data

- Do not store plain text passwords, use Firebase authentication
- Encrypt sensitive data in transit
- Implement appropriate data access policies

## API Documentation

- Use TypeDoc to generate code documentation
- Provide descriptions for all GraphQL types
- Use JSDoc comments to explain complex functions

To generate documentation:

```bash
npm run docs
```

Generated documentation will be located in the `docs/` directory.

## Contribution Guidelines

1. Ensure understanding of requirements before starting work
2. Follow the above code standards and best practices
3. All Pull Requests must include tests
4. Maintain clear and organized commit history

## Troubleshooting

### Common Issues

1. **Prisma Connection Issues**

   Check if the database URL is correct and ensure the database service is running:
   ```bash
   npx prisma db seed
   ```

2. **GraphQL Errors**

   Check if schema definitions and resolvers match:
   ```bash
   npm run dev
   ```
   Then use introspection queries in GraphQL Playground to check the schema.

3. **Redis Connection Issues**

   Ensure Redis service is running:
   ```bash
   redis-cli ping
   ```
   
4. **TypeScript Compilation Errors**
   
   Run type checking:
   ```bash
   npx tsc --noEmit
   ```
