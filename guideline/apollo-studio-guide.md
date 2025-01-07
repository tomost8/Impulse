# Apollo Studio Guide

## Accessing Apollo Studio
1. Start the server
2. Visit `http://localhost:3000/graphql`

## Using Apollo Studio

### 1. Exploring the Schema
- Click on "Schema" in the left sidebar
- You'll see all available operations:
  - `Query`: Read operations
  - `Mutation`: Write operations
  - Types: Data structure definitions

### 2. Making Queries

#### Get All Users
```graphql
query {
  users {
    id
    email
    name
    createdAt
    updatedAt
  }
}
```

#### Get Single User
```graphql
query {
  user(id: 1) {
    id
    email
    name
    createdAt
    updatedAt
  }
}
```

### 3. Making Mutations

#### Create User
```graphql
mutation {
  createUser(input: {
    email: "test@example.com",
    name: "Test User"
  }) {
    id
    email
    name
    createdAt
    updatedAt
  }
}
```

#### Update User
```graphql
mutation {
  updateUser(
    id: 1,
    input: {
      name: "Updated Name"
    }
  ) {
    id
    email
    name
    updatedAt
  }
}
```

#### Delete User
```graphql
mutation {
  deleteUser(id: 1)
}
```

### 4. Using Variables
1. Write your query with variables:
```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    email
    name
  }
}
```

2. Add variables in the "Variables" panel below:
```json
{
  "input": {
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

## Information for Frontend Developers

### API Endpoint
```
http://localhost:3000/graphql
```

### Available Types

#### User
```typescript
interface User {
  id: number;
  email: string;
  name?: string;
  firebaseUid?: string;
  createdAt: string;  // ISO DateTime
  updatedAt: string;  // ISO DateTime
}
```

#### CreateUserInput
```typescript
interface CreateUserInput {
  email: string;
  name?: string;
  firebaseUid?: string;
}
```

#### UpdateUserInput
```typescript
interface UpdateUserInput {
  email?: string;
  name?: string;
  firebaseUid?: string;
}
```

### Error Responses
```typescript
interface ErrorResponse {
  error: string;
  extensions?: {
    code: string;
    timestamp: string;
    details?: Record<string, any>;
  };
}
```

Error Types:
- `VALIDATION_ERROR` (400)
- `AUTHENTICATION_ERROR` (401)
- `AUTHORIZATION_ERROR` (403)
- `NOT_FOUND` (404)
- `BAD_REQUEST` (400)
- `INTERNAL_ERROR` (500)

## Tips
1. Use the "Schema" tab to explore available operations
2. Use auto-completion in the editor (Ctrl+Space)
3. Click "Docs" button for detailed documentation
4. Use "History" to see your previous operations
5. Use "Copy CURL" to get the HTTP request version 