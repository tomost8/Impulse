# Error Handling Guide

## Overview
This guide explains how to use the error handling system in our application. We have a standardized set of error types that help maintain consistency in error reporting across the application.

## Error Types

### 1. ValidationError (400)
Used when input data fails validation.

```typescript
import { ValidationError } from '@/modules/common/errors/graphql.error';

// Basic usage
throw new ValidationError('Invalid input data');

// With details
throw new ValidationError('Invalid input data', {
  field: 'email',
  reason: 'Invalid email format'
});
```

### 2. AuthenticationError (401)
Used when a user is not authenticated.

```typescript
import { AuthenticationError } from '@/modules/common/errors/graphql.error';

// Default message: "Not authenticated"
throw new AuthenticationError();

// Custom message
throw new AuthenticationError('Please login to access this resource');
```

### 3. AuthorizationError (403)
Used when a user doesn't have permission to perform an action.

```typescript
import { AuthorizationError } from '@/modules/common/errors/graphql.error';

// Default message: "Not authorized"
throw new AuthorizationError();

// Custom message
throw new AuthorizationError('Insufficient permissions to access this resource');
```

### 4. NotFoundError (404)
Used when a requested resource is not found.

```typescript
import { NotFoundError } from '@/modules/common/errors/graphql.error';

throw new NotFoundError('User not found');
```

### 5. BadRequestError (400)
Used for general client errors.

```typescript
import { BadRequestError } from '@/modules/common/errors/graphql.error';

// Basic usage
throw new BadRequestError('Invalid request');

// With details
throw new BadRequestError('Invalid request', {
  reason: 'Missing required fields',
  fields: ['name', 'email']
});
```

### 6. InternalError (500)
Used for server-side errors.

```typescript
import { InternalError } from '@/modules/common/errors/graphql.error';

// Default message: "Internal server error"
throw new InternalError();

// Custom message
throw new InternalError('Database connection failed');
```

## Error Structure

All errors include:
- `message`: Human-readable error message
- `extensions`: Additional error details
  - `code`: Error type code
  - `timestamp`: When the error occurred
  - `details`: Optional additional information (for ValidationError and BadRequestError)

Example error response:
```json
{
  "errors": [{
    "message": "Invalid input data",
    "extensions": {
      "code": "VALIDATION_ERROR",
      "timestamp": "2024-01-07T04:27:00.000Z",
      "details": {
        "field": "email",
        "reason": "Invalid email format"
      }
    }
  }]
}
```

## Best Practices

1. **Use Specific Error Types**
   ```typescript
   // ❌ Don't use generic errors
   throw new Error('Something went wrong');
   
   // ✅ Use specific error types
   throw new ValidationError('Invalid email format');
   ```

2. **Include Helpful Messages**
   ```typescript
   // ❌ Vague message
   throw new NotFoundError('Not found');
   
   // ✅ Clear, specific message
   throw new NotFoundError('User with ID 123 not found');
   ```

3. **Add Details When Relevant**
   ```typescript
   // ✅ Include details for debugging
   throw new ValidationError('Invalid input', {
     field: 'email',
     value: inputEmail,
     reason: 'Must be a valid email address'
   });
   ```

4. **Handle Errors Appropriately**
   ```typescript
   try {
     await userService.create(input);
   } catch (error) {
     if (error instanceof ValidationError) {
       // Handle validation errors
     } else if (error instanceof AuthenticationError) {
       // Handle authentication errors
     } else {
       // Convert unknown errors to InternalError
       throw new InternalError('Failed to create user');
     }
   }
   ```

## Error Service

The `ErrorService` provides centralized error handling:

1. **Handling Uncaught Exceptions**
   ```typescript
   @Inject()
   private errorService: ErrorService;
   
   // Register handler
   process.on('uncaughtException', (error) => {
     this.errorService.handleUncaughtException(error);
   });
   ```

2. **Handling Unhandled Rejections**
   ```typescript
   process.on('unhandledRejection', (reason) => {
     this.errorService.handleUnhandledRejection(reason);
   });
   ```

3. **Formatting GraphQL Errors**
   ```typescript
   // In Apollo Server config
   formatError: (error) => errorService.formatError(error)
   ```

## Environment-Specific Behavior

- **Development**: Includes detailed error information and stack traces
- **Production**: Returns sanitized error messages without sensitive details

## Testing Errors

Example of testing error handling:

```typescript
describe('UserService', () => {
  it('should throw ValidationError for invalid input', async () => {
    const invalidInput = { email: 'invalid-email' };
    
    await expect(userService.create(invalidInput))
      .rejects
      .toThrow(ValidationError);
  });
  
  it('should include correct error details', () => {
    try {
      throw new ValidationError('Invalid input', {
        field: 'email'
      });
    } catch (error) {
      expect(error.extensions.code).toBe('VALIDATION_ERROR');
      expect(error.extensions.details).toEqual({
        field: 'email'
      });
    }
  });
});
``` 