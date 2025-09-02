# If your code is well-structured and follows naming conventions, you can ask AI to generate typedoc documentation

# TypeDoc Documentation Guide

## Overview
TypeDoc generates documentation from TypeScript source code and comments. This guide explains how to write documentation comments and generate documentation.

## Writing Documentation Comments

### Basic Comment Structure
```typescript
/**
 * Description of the class/method/property
 */
```

### Class Documentation
```typescript
/**
 * Service responsible for user management
 * 
 * @example
 * ```typescript
 * const userService = Container.get(UserService);
 * const users = await userService.findAll();
 * ```
 */
@Service()
export class UserService {
  // ...
}
```

### Method Documentation
```typescript
/**
 * Creates a new user
 * 
 * @param {CreateUserInput} input - User creation data
 * @returns {Promise<User>} Created user instance
 * @throws {ValidationError} When input data is invalid
 * @throws {BadRequestError} When user with email already exists
 * 
 * @example
 * ```typescript
 * const user = await userService.create({
 *   email: "user@example.com",
 *   name: "John Doe"
 * });
 * ```
 */
async create(input: CreateUserInput): Promise<User> {
  // ...
}
```

### Property Documentation
```typescript
/**
 * Database client instance
 * @private
 */
private prisma: PrismaClient;

/**
 * User's email address
 * @public
 */
public email: string;
```

### Interface Documentation
```typescript
/**
 * User creation input data
 * 
 * @interface CreateUserInput
 */
interface CreateUserInput {
  /** User's email address */
  email: string;
  
  /** User's display name (optional) */
  name?: string;
  
  /** Firebase UID for authentication */
  firebaseUid?: string;
}
```

## Common Tags

### Function/Method Tags
- `@param` - Parameter description
- `@returns` - Return value description
- `@throws` - Possible errors
- `@example` - Usage example
- `@async` - Marks async methods

### Visibility Tags
- `@public` - Public visibility
- `@private` - Private visibility
- `@protected` - Protected visibility

### Other Tags
- `@deprecated` - Mark as deprecated
- `@since` - Version introduced
- `@see` - Reference other documentation
- `@todo` - Future improvements

## Best Practices

1. **Be Consistent**
   ```typescript
   /**
    * Always start with a clear description
    * 
    * @param input - Start param descriptions with lowercase
    * @returns Description starts with uppercase
    * @throws {ErrorType} Start error descriptions with "When"
    */
   ```

2. **Use Examples**
   ```typescript
   /**
    * @example
    * ```typescript
    * // Show real-world usage
    * const result = await service.method();
    * ```
    */
   ```

3. **Document Errors**
   ```typescript
   /**
    * @throws {ValidationError} When input data is invalid
    * @throws {NotFoundError} When user is not found
    */
   ```

4. **Include Type Information**
   ```typescript
   /**
    * @param {string} id - User identifier
    * @returns {Promise<User>} User instance
    */
   ```

## Generating Documentation

1. **Run Documentation Generation**
   ```bash
   npm run docs
   ```

2. **View Generated Documentation**
   - Open `docs/index.html` in your browser
   - Navigate through modules, classes, and interfaces

## Configuration (typedoc.json)
```json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs",
  "excludePrivate": true,
  "excludeProtected": true,
  "excludeExternals": true,
  "theme": "default",
  "name": "API Documentation"
}
```

## Tips
1. Document public APIs thoroughly
2. Include examples for complex operations
3. Keep comments up to date with code changes
4. Use markdown in comments for better formatting
5. Document error cases and edge conditions

## Example: Complete Class Documentation
```typescript
/**
 * Service responsible for user management operations
 * 
 * This service handles all user-related operations including
 * creation, updates, deletion, and queries.
 * 
 * @example
 * ```typescript
 * const userService = Container.get(UserService);
 * 
 * // Create a user
 * const user = await userService.create({
 *   email: "user@example.com",
 *   name: "John Doe"
 * });
 * ```
 */
@Service()
export class UserService {
  /**
   * Creates service instance
   * 
   * @param prisma - Database client instance
   */
  constructor(private prisma: PrismaClient) {}

  /**
   * Finds user by ID
   * 
   * @param {number} id - User identifier
   * @returns {Promise<User>} User instance if found
   * @throws {NotFoundError} When user does not exist
   * 
   * @example
   * ```typescript
   * const user = await userService.findById(1);
   * console.log(user.email);
   * ```
   */
  async findById(id: number): Promise<User> {
    // Implementation...
  }
}
``` 