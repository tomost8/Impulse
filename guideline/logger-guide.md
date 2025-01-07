# Logger Usage Guide

## Overview
Our application uses Winston for logging, configured with different log levels and formats for development and production environments. The logger supports file rotation, console output, and request logging.

## Log Levels

The logger supports the following levels (from highest to lowest priority):
```typescript
const levels = {
  error: 0,  // Error conditions
  warn: 1,   // Warning conditions
  info: 2,   // Informational messages
  http: 3,   // HTTP request logs
  debug: 4,  // Debug messages
}
```

## Basic Usage

### Importing the Logger
```typescript
import logger from '@/config/logger';
```

### Logging Messages

```typescript
// Error logging
logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack
});

// Warning logging
logger.warn('Rate limit threshold reached', {
  ip: request.ip,
  endpoint: request.path
});

// Info logging
logger.info('User created successfully', {
  userId: user.id,
  email: user.email
});

// HTTP request logging
logger.http('API request received', {
  method: 'POST',
  path: '/api/users',
  body: request.body
});

// Debug logging (development only)
logger.debug('Processing request payload', {
  payload: request.body,
  timestamp: new Date().toISOString()
});
```

## Best Practices

1. **Include Contextual Information**
   ```typescript
   // ❌ Poor logging
   logger.error('Operation failed');
   
   // ✅ Good logging
   logger.error('Failed to create user', {
     operation: 'createUser',
     input: sanitizedUserData,
     error: error.message,
     stack: error.stack
   });
   ```

2. **Use Appropriate Log Levels**
   ```typescript
   // ❌ Wrong level
   logger.error('User not found');
   
   // ✅ Correct level
   logger.warn('User not found', { userId });
   ```

3. **Structured Logging**
   ```typescript
   // ❌ Unstructured
   logger.info(`User ${userId} updated profile with name ${name}`);
   
   // ✅ Structured
   logger.info('User updated profile', {
     userId,
     updates: { name },
     timestamp: new Date().toISOString()
   });
   ```

4. **Sensitive Data Handling**
   ```typescript
   // ❌ Logging sensitive data
   logger.info('User login', { email, password });
   
   // ✅ Safe logging
   logger.info('User login', { 
     userId,
     maskedEmail: maskEmail(email)
   });
   ```

## Request Logging Middleware

The `requestLogger` middleware automatically logs HTTP requests:

```typescript
import { requestLogger } from '@/config/logger';

// In your Express app setup
app.use(requestLogger);
```

This will log each request with:
- HTTP method
- URL
- Status code
- Response time
- User agent
- IP address

Example output:
```
2024-01-07 04:55:00:000 http: Request completed {
  "method": "POST",
  "url": "/api/users",
  "status": 201,
  "duration": "125ms",
  "userAgent": "Mozilla/5.0...",
  "ip": "127.0.0.1"
}
```

## Log File Management

Logs are automatically managed with daily rotation:

1. **Error Logs**
   - Location: `logs/error-YYYY-MM-DD.log`
   - Contains only error level logs
   - Rotated daily
   - Compressed after rotation
   - Kept for 14 days

2. **Combined Logs**
   - Location: `logs/combined-YYYY-MM-DD.log`
   - Contains all log levels
   - Rotated daily
   - Compressed after rotation
   - Kept for 14 days

## Environment-Specific Behavior

### Development
- Console output enabled with colorization
- Debug level logging enabled
- Full error stacks included

### Production
- Console output disabled
- Minimum log level set to 'warn'
- Sensitive information sanitized
- Structured JSON format for better parsing

## Examples

### Service Layer Logging
```typescript
@Service()
export class UserService {
  async createUser(input: CreateUserInput): Promise<User> {
    try {
      logger.info('Creating new user', { input });
      
      const user = await this.prisma.user.create({
        data: input
      });
      
      logger.info('User created successfully', { 
        userId: user.id,
        email: user.email 
      });
      
      return user;
    } catch (error) {
      logger.error('Failed to create user', {
        input,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
```

### Error Handling with Logging
```typescript
try {
  await someOperation();
} catch (error) {
  logger.error('Operation failed', {
    operation: 'someOperation',
    error: error.message,
    stack: error.stack,
    context: {
      // Additional context
      userId,
      timestamp: new Date().toISOString()
    }
  });
  
  // Re-throw or handle appropriately
  throw new InternalError('Operation failed');
}
```

### Performance Monitoring
```typescript
async function measureOperationTime(operation: () => Promise<any>) {
  const start = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - start;
    
    logger.info('Operation completed', {
      operation: operation.name,
      duration: `${duration}ms`,
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    logger.error('Operation failed', {
      operation: operation.name,
      duration: `${duration}ms`,
      error: error.message,
      success: false
    });
    
    throw error;
  }
}
``` 