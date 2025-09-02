# GraphQL Subscription Implementation Guide

This guide will help you understand and implement GraphQL subscription functionality to support real-time data updates.

## Table of Contents
1. [Overview](#overview)
2. [Implementation Steps](#implementation-steps)
3. [Example Implementation](#example-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Best Practices](#best-practices)
6. [Common Issues](#common-issues)

## Overview

GraphQL subscriptions are a real-time data feature that allows servers to push updates to clients when specific events occur. In our project, we use the `@graphql-yoga/subscription` PubSub system to implement this functionality.

## Implementation Steps

### 1. Define Event Constants
Define event constants in `src/config/pubsub.ts`:

```typescript
// Example: User-related events
export const USER_CREATED = 'USER_CREATED';
export const USER_UPDATED = 'USER_UPDATED';
```

### 2. Create Subscription Types
Define subscription return types in the corresponding module's schema type files:

```typescript
// Example: src/modules/user/schema/userTypes.ts
@ObjectType()
export class User {
  @Field(() => ID)
  id: number;

  @Field()
  email: string;

  // ... other fields
}

@ObjectType()
export class UserCreatedPayload {
  @Field(() => User)
  userCreated: User;
}
```

### 3. Implement Subscription Resolvers
Create a specialized subscription resolver class:

```typescript
// Example: src/modules/user/resolvers/userSubscriptions.ts
@Service()
@Resolver()
export class UserSubscriptions {
  @Subscription(() => User, {
    topics: USER_CREATED,
    description: 'Subscribe to user creation events'
  })
  userCreated(@Root() payload: { userCreated: User }): User {
    console.log('Resolving user subscription data:', payload);
    return payload.userCreated;
  }
}
```

### 4. Publish Events
Publish events in the corresponding service:

```typescript
// Example: src/services/userService.ts
@Service()
export class UserService {
  async createUser(input: CreateUserInput): Promise<User> {
    const newUser = await this.prisma.user.create({
      data: input
    });

    // Publish user creation event
    await pubsub.publish(USER_CREATED, {
      userCreated: newUser
    });

    return newUser;
  }
}
```

### 5. Client Subscription
Implement subscriptions on the frontend:

```graphql
subscription OnUserCreated {
  userCreated {
    id
    email
    username
    createdAt
  }
}
```

## Example Implementation

Here's a complete user creation subscription example:

1. **Event Constants** (src/config/pubsub.ts):
```typescript
import { createPubSub } from '@graphql-yoga/subscription';

export const pubsub = createPubSub();
export const USER_CREATED = 'USER_CREATED';
```

2. **Type Definitions** (src/modules/user/schema/userTypes.ts):
```typescript
@ObjectType()
export class User {
  @Field(() => ID)
  id: number;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field()
  createdAt: Date;
}
```

3. **Subscription Resolver** (src/modules/user/resolvers/userSubscriptions.ts):
```typescript
@Service()
@Resolver()
export class UserSubscriptions {
  @Subscription(() => User, {
    topics: USER_CREATED,
    description: 'Subscribe to user creation events'
  })
  userCreated(@Root() payload: { userCreated: User }): User {
    return payload.userCreated;
  }
}
```

4. **Service Implementation** (src/services/userService.ts):
```typescript
@Service()
export class UserService {
  constructor(private prisma: PrismaClient) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const newUser = await this.prisma.user.create({
      data: input
    });

    await pubsub.publish(USER_CREATED, {
      userCreated: newUser
    });

    return newUser;
  }
}
```

## Frontend Implementation

### React Native Special Notes

When implementing WebSocket connections in React Native, pay attention to the following points:

1. **WebSocket URL Configuration**
```javascript
// Development environment
const wsUrl = Platform.select({
  ios: 'ws://localhost:3000/graphql',        // iOS simulator
  android: 'ws://10.0.2.2:3000/graphql',     // Android emulator
  default: 'ws://localhost:3000/graphql'
});

// Production environment
const PROD_WS_URL = 'wss://your-api-domain.com/graphql';
const wsUrl = __DEV__ ? devWsUrl : PROD_WS_URL;
```

2. **Usage in React Native Components**
```typescript
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

function SubscriptionComponent() {
  const wsRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    // Select correct WebSocket URL based on platform
    const wsUrl = Platform.select({
      ios: 'ws://localhost:3000/graphql',
      android: 'ws://10.0.2.2:3000/graphql',
      default: 'ws://localhost:3000/graphql'
    });

    const ws = new WebSocket(wsUrl, 'graphql-transport-ws');
    wsRef.current = ws;

    ws.onopen = () => {
      // Send initialization message
      ws.send(JSON.stringify({
        type: 'connection_init',
        payload: {}
      }));

      // Send subscription request
      subscribeToUpdates(ws);
    };

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const subscribeToUpdates = (ws: WebSocket) => {
    const subscriptionId = generateId();
    ws.send(JSON.stringify({
      id: subscriptionId,
      type: 'subscribe',
      payload: {
        query: `
          subscription {
            userCreated {
              id
              email
              username
            }
          }
        `
      }
    }));
  };

  return (
    // Component JSX
  );
}
```

3. **Network Status Handling**
```typescript
import NetInfo from '@react-native-community/netinfo';

function SubscriptionComponent() {
  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        // Reconnect when network recovers
        reconnectWebSocket();
      } else {
        // Clean up connection when network disconnects
        cleanupWebSocket();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
}
```

4. **Auto-reconnection Mechanism**
```typescript
class RNWebSocketClient {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Initial reconnection wait time

  connect() {
    try {
      this.ws = new WebSocket(this.getWsUrl(), 'graphql-transport-ws');
      this.setupWebSocketListeners();
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  private getWsUrl() {
    if (__DEV__) {
      return Platform.select({
        ios: 'ws://localhost:3000/graphql',
        android: 'ws://10.0.2.2:3000/graphql',
        default: 'ws://localhost:3000/graphql'
      });
    }
    return 'wss://your-api-domain.com/graphql';
  }

  private handleConnectionError(error: any) {
    console.error('WebSocket connection error:', error);
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts));
    }
  }
}
```

5. **Performance Optimization**
```typescript
// Use debounce for frequent subscription requests
import { debounce } from 'lodash';

const debouncedSubscribe = debounce((ws: WebSocket, query: string) => {
  const subscriptionId = generateId();
  ws.send(JSON.stringify({
    id: subscriptionId,
    type: 'subscribe',
    payload: { query }
  }));
}, 300);

// Use useCallback to optimize subscription functions
const handleSubscribe = useCallback((query: string) => {
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    debouncedSubscribe(wsRef.current, query);
  }
}, []);
```

### WebSocket Connection Setup

1. **Establish Connection**
```javascript
const ws = new WebSocket('ws://localhost:3000/graphql', 'graphql-transport-ws');

// Initialize when connection opens
ws.onopen = () => {
    console.log('Connection opened');
    // Send initialization message
    const initMessage = {
        type: 'connection_init',
        payload: {}
    };
    ws.send(JSON.stringify(initMessage));
};
```

2. **Handle Connection Events**
```javascript
// Handle connection close
ws.onclose = (event) => {
    console.log(`Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
    // Clean up subscription state
};

// Handle errors
ws.onerror = (error) => {
    console.log('WebSocket error:', error);
};
```

### Subscription Management

1. **Initiate Subscription**
```javascript
function subscribe(subscriptionQuery) {
    const subscriptionId = generateSubscriptionId(); // Generate unique ID
    const subscribeMessage = {
        id: subscriptionId,
        type: 'subscribe',
        payload: {
            query: subscriptionQuery
        }
    };
    ws.send(JSON.stringify(subscribeMessage));
    return subscriptionId;
}

// Example: Subscribe to user creation events
const userSubscriptionQuery = `
    subscription {
        userCreated {
            id
            email
            first_name
            last_name
            username
            created_at
        }
    }
`;
const subscriptionId = subscribe(userSubscriptionQuery);
```

2. **Cancel Subscription**
```javascript
function unsubscribe(subscriptionId) {
    const completeMessage = {
        id: subscriptionId,
        type: 'complete'
    };
    ws.send(JSON.stringify(completeMessage));
}
```

3. **Handle Subscription Data**
```javascript
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'next') {
        // Handle subscription data
        if (data.payload?.data?.userCreated) {
            const user = data.payload.data.userCreated;
            console.log('New user created:', user);
            // Update UI display
        }
    }
};
```

### Complete Subscription Example

```javascript
class GraphQLSubscriptionClient {
    constructor(url) {
        this.url = url;
        this.subscriptions = new Map();
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url, 'graphql-transport-ws');
        
        this.ws.onopen = () => {
            this.ws.send(JSON.stringify({
                type: 'connection_init',
                payload: {}
            }));
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            this.cleanup();
        };
    }

    subscribe(query, callbacks) {
        const id = this.generateId();
        
        this.subscriptions.set(id, callbacks);
        
        this.ws.send(JSON.stringify({
            id,
            type: 'subscribe',
            payload: { query }
        }));

        return id;
    }

    unsubscribe(id) {
        if (this.subscriptions.has(id)) {
            this.ws.send(JSON.stringify({
                id,
                type: 'complete'
            }));
            this.subscriptions.delete(id);
        }
    }

    handleMessage(data) {
        const callbacks = this.subscriptions.get(data.id);
        if (callbacks && data.type === 'next') {
            callbacks.onData(data.payload.data);
        }
    }

    cleanup() {
        this.subscriptions.clear();
    }

    generateId() {
        return Math.random().toString(36).substring(2, 15);
    }
}

// Usage example
const client = new GraphQLSubscriptionClient('ws://localhost:3000/graphql');

// Subscribe to user creation events
const subscriptionId = client.subscribe(
    `subscription {
        userCreated {
            id
            email
            username
        }
    }`,
    {
        onData: (data) => {
            console.log('New user:', data.userCreated);
            updateUI(data.userCreated);
        }
    }
);

// Cancel subscription
function cleanup() {
    client.unsubscribe(subscriptionId);
}
```

### Important Notes

1. **Connection Management**
   - Implement reconnection mechanisms
   - Handle connection timeouts
   - Clean up subscriptions when components unmount

2. **Error Handling**
   - Handle network errors
   - Handle subscription errors
   - Implement error retry mechanisms

3. **State Management**
   - Track active subscriptions
   - Manage subscription states
   - Handle duplicate subscriptions

4. **Performance Optimization**
   - Reasonably control subscription quantity
   - Cancel unnecessary subscriptions promptly
   - Avoid frequent subscribe/unsubscribe operations

## Best Practices

1. **Naming Conventions**
   - Event constants use uppercase snake_case: `USER_CREATED`
   - Subscription fields use camelCase: `userCreated`
   - Type names use PascalCase: `UserCreatedPayload`

2. **Error Handling**
   - Ensure data integrity before publishing events
   - Add appropriate error handling in subscription resolvers
   - Use logging for critical operations

3. **Performance Considerations**
   - Avoid sending overly large data payloads in subscriptions
   - Reasonably use filters to reduce unnecessary updates
   - Consider adding subscription timeout mechanisms

4. **Security**
   - Implement appropriate authentication and authorization mechanisms
   - Limit subscription quantity and frequency
   - Protect sensitive data

5. **Testing**
   - Write unit tests for subscription functionality
   - Test subscription connections and disconnections
   - Verify event publishing and receiving

## Common Issues

1. **Subscriptions Not Triggering**
   - Check if event names match
   - Confirm pubsub instances are properly shared
   - Verify WebSocket connections are normal

2. **Performance Issues**
   - Check if subscription quantity is excessive
   - Optimize data payload sizes
   - Consider using batch processing

3. **Memory Leaks**
   - Ensure proper cleanup of unused subscriptions
   - Implement subscription lifecycle management
   - Monitor active subscription quantities
