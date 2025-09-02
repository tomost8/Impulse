# Impulse Backend Project Structure Documentation

## Project Overview

Impulse is a full-stack application backend based on Node.js, using GraphQL as the API layer, Prisma as the ORM, and PostgreSQL as the database. The project's main features include user management, community management, activity tracking, instant messaging, notification systems, and other core social networking functionalities.

## Technology Stack

### Core Frameworks and Libraries

- **Node.js**: Runtime environment (v20+)
- **TypeScript**: For type-safe code development
- **GraphQL**: API query language and runtime
  - **Apollo Server**: GraphQL server implementation
  - **Type-GraphQL**: Decorator-based GraphQL schema definition
- **Prisma**: ORM tool for database access and model definition
- **PostgreSQL**: Primary database system
- **Express**: Web server framework
- **Firebase Admin**: For authentication and cloud service integration
- **Bull**: Background task queue system
- **Redis**: For pub/sub systems and task queues
- **Winston**: Logging system

### Development Tools

- **Jest**: Testing framework
- **Nodemon**: Hot reload during development
- **TypeDoc**: Documentation generation tool
- **Zod**: Runtime data validation

## Project Structure

```
Impulse/
├── prisma/                   # Prisma ORM configuration and models
│   ├── migrations/           # Database migration files
│   └── schema.prisma         # Database model definitions
├── src/                      # Source code
│   ├── config/               # Configuration files
│   │   ├── env.ts            # Environment variable configuration
│   │   ├── firebase.ts       # Firebase configuration
│   │   ├── graphql.ts        # GraphQL configuration
│   │   ├── logger.ts         # Logging configuration
│   │   ├── prisma.ts         # Prisma client configuration
│   │   ├── pubsub.ts         # Pub/Sub configuration
│   │   └── websocket.ts      # WebSocket configuration
│   ├── middleware/           # Middleware
│   ├── modules/              # Functional modules
│   │   ├── activity/         # Activity module
│   │   ├── chat/             # Chat module
│   │   ├── comment/          # Comment module
│   │   ├── common/           # Common module
│   │   ├── community/        # Community module
│   │   ├── friendship/       # Friendship module
│   │   ├── notification/     # Notification module
│   │   ├── point/            # Point module
│   │   ├── post/             # Post module
│   │   └── user/             # User module
│   │       ├── resolvers/    # GraphQL resolvers
│   │       │   ├── UserQueries.ts     # Query resolvers
│   │       │   ├── UserMutations.ts   # Mutation resolvers
│   │       │   └── UserSubscriptions.ts # Subscription resolvers
│   │       ├── schema/       # GraphQL schema definitions
│   │       └── index.ts      # Module exports
│   ├── scripts/              # Script files
│   ├── server/               # Server-related code
│   ├── services/             # Service layer
│   │   ├── activityService.ts        # Activity service
│   │   ├── chatService.ts            # Chat service
│   │   ├── commentService.ts         # Comment service
│   │   ├── communityService.ts       # Community service
│   │   ├── friendshipService.ts      # Friendship service
│   │   ├── notificationService.ts    # Notification service
│   │   ├── pointService.ts           # Point service
│   │   ├── postService.ts            # Post service
│   │   └── userService.ts            # User service
│   ├── test/                 # Unit tests
│   ├── types/                # Type definitions
│   ├── app.ts                # Application configuration
│   └── index.ts              # Application entry point
├── test/                     # Integration tests
├── logs/                     # Log files
├── schema.graphql            # Generated GraphQL schema
├── package.json              # Project dependency configuration
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest testing configuration
└── typedoc.json              # TypeDoc documentation configuration
```

## 🏗️ Architecture Patterns

### Domain-Driven Design (DDD)

The project follows DDD principles with clear separation of concerns:

- **Modules**: Each business domain has its own module
- **Services**: Business logic is encapsulated in service classes
- **Resolvers**: GraphQL resolvers act as thin controllers
- **Schema**: GraphQL types represent the domain model

### Layered Architecture

```
┌─────────────────────────────────────┐
│           GraphQL Layer             │ ← Resolvers, Schema
├─────────────────────────────────────┤
│           Service Layer             │ ← Business Logic
├─────────────────────────────────────┤
│           Data Layer                │ ← Prisma, Database
└─────────────────────────────────────┘
```

### Dependency Injection

- Uses TypeDI for dependency injection
- Services are injected through constructors
- Singleton pattern for shared services
- Easy testing through mock injection

## 📦 Modules and Features

### User Module (User)
- **Purpose**: User management and authentication
- **Key Features**:
  - User registration, login, and authentication
  - User profile management
  - User login streak tracking
  - Privacy and security settings
- **Files**: `src/modules/user/`

### Community Module (Community)
- **Purpose**: Community and group management
- **Key Features**:
  - Community creation and management
  - Community member management
  - Community categorization
  - Community search and discovery
- **Files**: `src/modules/community/`

### Activity Module (Activity)
- **Purpose**: Activity tracking and management
- **Key Features**:
  - Activity creation and management
  - Activity scheduling
  - Activity categorization
  - Activity completion status tracking
- **Files**: `src/modules/activity/`

### Post Module (Post)
- **Purpose**: Content sharing and management
- **Key Features**:
  - Post creation and management
  - Media content support
  - Post browsing and interaction
  - Content expiration mechanisms
- **Files**: `src/modules/post/`

### Chat Module (Chat)
- **Purpose**: Real-time messaging system
- **Key Features**:
  - One-on-one and group chats
  - Message sending and receiving
  - Real-time communication
  - Chat member management
- **Files**: `src/modules/chat/`

### Point Module (Point)
- **Purpose**: Gamification and rewards system
- **Key Features**:
  - Point accumulation and consumption
  - Periodic resets
  - Point statistics and rankings
  - Reward redemption system
- **Files**: `src/modules/point/`

### Notification Module (Notification)
- **Purpose**: User notification system
- **Key Features**:
  - System notifications
  - Community notifications
  - Timed reminders
  - Notification delivery status management
- **Files**: `src/modules/notification/`

### Comments and Interactions (Comment & Like)
- **Purpose**: User engagement and interaction
- **Key Features**:
  - Post comments
  - Content likes
  - Interaction statistics
- **Files**: `src/modules/comment/`

## 🔧 Configuration Management

### Environment Configuration

The project uses `.env` files for environment configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/impulse_db"

# Firebase Authentication
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email"
FIREBASE_PRIVATE_KEY="your-private-key"

# Server
PORT=3000
NODE_ENV=development

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-jwt-secret"
```

### Configuration Files

- **`src/config/env.ts`**: Environment variable validation
- **`src/config/firebase.ts`**: Firebase configuration
- **`src/config/graphql.ts`**: GraphQL server configuration
- **`src/config/logger.ts`**: Logging configuration
- **`src/config/prisma.ts`**: Database connection configuration

## 🚀 Performance Considerations

### Database Optimization

- **Indexing**: Strategic database indexes on frequently queried fields
- **Query Optimization**: Use Prisma's `include` to solve N+1 problems
- **Connection Pooling**: Efficient database connection management
- **Migration Strategy**: Zero-downtime migrations

### Caching Strategy

- **Redis Caching**: Hot data caching with appropriate TTL
- **GraphQL Caching**: Query result caching
- **DataLoader**: Batch loading to prevent N+1 queries

### Real-time Performance

- **WebSocket**: Efficient real-time communication
- **GraphQL Subscriptions**: Real-time data updates
- **Pub/Sub**: Event-driven architecture for scalability

## 🔒 Security Architecture

### Authentication Flow

```
Client Request → Firebase Auth → JWT Token → GraphQL Resolver → Service Layer
```

### Authorization Layers

1. **Firebase Authentication**: User identity verification
2. **JWT Validation**: Token-based session management
3. **Role-Based Access Control**: Permission-based operations
4. **Input Validation**: Data sanitization and validation

### Security Middleware

- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Rate Limiting**: Request throttling
- **Input Sanitization**: XSS and injection prevention

## 📊 Data Flow

### GraphQL Request Flow

```
Client → GraphQL Resolver → Service Layer → Prisma → Database
                ↓
            Response ← Service Layer ← Prisma ← Database
```

### Real-time Data Flow

```
Event → Service → Pub/Sub → WebSocket → Client
```

### Background Job Flow

```
Service → Bull Queue → Redis → Worker → Database
```

## 🧪 Testing Architecture

### Test Structure

```
test/
├── unit/           # Unit tests for services
├── integration/    # API integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data and mocks
```

### Testing Strategy

- **Unit Tests**: Service layer and utility functions
- **Integration Tests**: GraphQL resolvers and database operations
- **E2E Tests**: Complete user workflows
- **Mock Strategy**: External service mocking

## 📈 Scalability Considerations

### Horizontal Scaling

- **Stateless Design**: No server-side session storage
- **Load Balancing**: Multiple server instances
- **Database Sharding**: Horizontal database partitioning
- **Microservices**: Future service decomposition

### Vertical Scaling

- **Connection Pooling**: Efficient resource utilization
- **Caching Layers**: Multi-level caching strategy
- **Async Processing**: Background job processing
- **Resource Optimization**: Memory and CPU optimization

## 🔄 Deployment Architecture

### Environment Strategy

- **Development**: Local development with hot reload
- **Staging**: Production-like testing environment
- **Production**: Optimized production deployment

### CI/CD Pipeline

```
Code Push → Tests → Build → Deploy → Health Check
```

### Monitoring and Observability

- **Logging**: Structured logging with Winston
- **Metrics**: Performance and health metrics
- **Tracing**: Request tracing and debugging
- **Alerting**: Automated error notifications

## 📚 Next Steps

After understanding the project structure:

1. **Setup Development Environment**: Follow the [Development Guide](development-guide.md)
2. **Explore Specific Features**: Check the relevant guides in `docs/guides/`
3. **Understand API Usage**: Review [API Documentation](../guides/api-documentation.md)
4. **Start Contributing**: Follow the development workflow in the Development Guide

## 🤝 Contributing to Architecture

When contributing to the project architecture:

1. **Follow DDD Principles**: Maintain clear domain boundaries
2. **Keep Modules Focused**: Each module should have a single responsibility
3. **Maintain Consistency**: Follow established patterns and conventions
4. **Document Changes**: Update this document when making architectural changes
5. **Consider Performance**: Always think about scalability and performance implications
