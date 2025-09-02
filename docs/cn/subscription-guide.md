# GraphQL 订阅功能实现指南

本指南将帮助你理解和实现 GraphQL 订阅功能，以支持实时数据更新。

## 目录
1. [概述](#概述)
2. [实现步骤](#实现步骤)
3. [示例实现](#示例实现)
4. [前端实现](#前端实现)
5. [最佳实践](#最佳实践)
6. [常见问题](#常见问题)

## 概述

GraphQL 订阅是一种实时数据功能，允许服务器在特定事件发生时向客户端推送更新。在我们的项目中，使用 `@graphql-yoga/subscription` 的 PubSub 系统来实现这一功能。

## 实现步骤

### 1. 定义事件常量
在 `src/config/pubsub.ts` 中定义事件常量：

```typescript
// 示例：用户相关事件
export const USER_CREATED = 'USER_CREATED';
export const USER_UPDATED = 'USER_UPDATED';
```

### 2. 创建订阅类型
在对应模块的 schema 类型文件中定义订阅的返回类型：

```typescript
// 示例：src/modules/user/schema/userTypes.ts
@ObjectType()
export class User {
  @Field(() => ID)
  id: number;

  @Field()
  email: string;

  // ... 其他字段
}

@ObjectType()
export class UserCreatedPayload {
  @Field(() => User)
  userCreated: User;
}
```

### 3. 实现订阅解析器
创建一个专门的订阅解析器类：

```typescript
// 示例：src/modules/user/resolvers/userSubscriptions.ts
@Service()
@Resolver()
export class UserSubscriptions {
  @Subscription(() => User, {
    topics: USER_CREATED,
    description: '订阅用户创建事件'
  })
  userCreated(@Root() payload: { userCreated: User }): User {
    console.log('解析用户订阅数据:', payload);
    return payload.userCreated;
  }
}
```

### 4. 发布事件
在相应的 service 中发布事件：

```typescript
// 示例：src/services/userService.ts
@Service()
export class UserService {
  async createUser(input: CreateUserInput): Promise<User> {
    const newUser = await this.prisma.user.create({
      data: input
    });

    // 发布用户创建事件
    await pubsub.publish(USER_CREATED, {
      userCreated: newUser
    });

    return newUser;
  }
}
```

### 5. 客户端订阅
在前端实现订阅：

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

## 示例实现

以下是一个完整的用户创建订阅示例：

1. **事件常量** (src/config/pubsub.ts):
```typescript
import { createPubSub } from '@graphql-yoga/subscription';

export const pubsub = createPubSub();
export const USER_CREATED = 'USER_CREATED';
```

2. **类型定义** (src/modules/user/schema/userTypes.ts):
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

3. **订阅解析器** (src/modules/user/resolvers/userSubscriptions.ts):
```typescript
@Service()
@Resolver()
export class UserSubscriptions {
  @Subscription(() => User, {
    topics: USER_CREATED,
    description: '订阅用户创建事件'
  })
  userCreated(@Root() payload: { userCreated: User }): User {
    return payload.userCreated;
  }
}
```

4. **Service 实现** (src/services/userService.ts):
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

## 前端实现

### React Native 特殊说明

在 React Native 中实现 WebSocket 连接时，需要注意以下几点：

1. **WebSocket URL 配置**
```javascript
// 开发环境
const wsUrl = Platform.select({
  ios: 'ws://localhost:3000/graphql',        // iOS 模拟器
  android: 'ws://10.0.2.2:3000/graphql',     // Android 模拟器
  default: 'ws://localhost:3000/graphql'
});

// 生产环境
const PROD_WS_URL = 'wss://your-api-domain.com/graphql';
const wsUrl = __DEV__ ? devWsUrl : PROD_WS_URL;
```

2. **React Native 组件中的使用**
```typescript
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

function SubscriptionComponent() {
  const wsRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    // 根据平台选择正确的 WebSocket URL
    const wsUrl = Platform.select({
      ios: 'ws://localhost:3000/graphql',
      android: 'ws://10.0.2.2:3000/graphql',
      default: 'ws://localhost:3000/graphql'
    });

    const ws = new WebSocket(wsUrl, 'graphql-transport-ws');
    wsRef.current = ws;

    ws.onopen = () => {
      // 发送初始化消息
      ws.send(JSON.stringify({
        type: 'connection_init',
        payload: {}
      }));

      // 发送订阅请求
      subscribeToUpdates(ws);
    };

    // 清理函数
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
    // 组件 JSX
  );
}
```

3. **网络状态处理**
```typescript
import NetInfo from '@react-native-community/netinfo';

function SubscriptionComponent() {
  useEffect(() => {
    // 监听网络状态
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        // 网络恢复时重新连接
        reconnectWebSocket();
      } else {
        // 网络断开时清理连接
        cleanupWebSocket();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
}
```

4. **自动重连机制**
```typescript
class RNWebSocketClient {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // 初始重连等待时间

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

5. **性能优化**
```typescript
// 使用防抖处理频繁的订阅请求
import { debounce } from 'lodash';

const debouncedSubscribe = debounce((ws: WebSocket, query: string) => {
  const subscriptionId = generateId();
  ws.send(JSON.stringify({
    id: subscriptionId,
    type: 'subscribe',
    payload: { query }
  }));
}, 300);

// 使用 useCallback 优化订阅函数
const handleSubscribe = useCallback((query: string) => {
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    debouncedSubscribe(wsRef.current, query);
  }
}, []);
```

### WebSocket 连接设置

1. **建立连接**
```javascript
const ws = new WebSocket('ws://localhost:3000/graphql', 'graphql-transport-ws');

// 连接打开时初始化
ws.onopen = () => {
    console.log('Connection opened');
    // 发送初始化消息
    const initMessage = {
        type: 'connection_init',
        payload: {}
    };
    ws.send(JSON.stringify(initMessage));
};
```

2. **处理连接事件**
```javascript
// 处理连接关闭
ws.onclose = (event) => {
    console.log(`Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
    // 清理订阅状态
};

// 处理错误
ws.onerror = (error) => {
    console.log('WebSocket error:', error);
};
```

### 订阅管理

1. **发起订阅**
```javascript
function subscribe(subscriptionQuery) {
    const subscriptionId = generateSubscriptionId(); // 生成唯一ID
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

// 示例：订阅用户创建事件
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

2. **取消订阅**
```javascript
function unsubscribe(subscriptionId) {
    const completeMessage = {
        id: subscriptionId,
        type: 'complete'
    };
    ws.send(JSON.stringify(completeMessage));
}
```

3. **处理订阅数据**
```javascript
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'next') {
        // 处理订阅数据
        if (data.payload?.data?.userCreated) {
            const user = data.payload.data.userCreated;
            console.log('New user created:', user);
            // 更新UI显示
        }
    }
};
```

### 完整的订阅示例

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

// 使用示例
const client = new GraphQLSubscriptionClient('ws://localhost:3000/graphql');

// 订阅用户创建事件
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

// 取消订阅
function cleanup() {
    client.unsubscribe(subscriptionId);
}
```

### 注意事项

1. **连接管理**
   - 实现重连机制
   - 处理连接超时
   - 在组件卸载时清理订阅

2. **错误处理**
   - 处理网络错误
   - 处理订阅错误
   - 实现错误重试机制

3. **状态管理**
   - 跟踪活动订阅
   - 管理订阅状态
   - 处理重复订阅

4. **性能优化**
   - 合理控制订阅数量
   - 及时取消不需要的订阅
   - 避免频繁的订阅/取消操作

## 最佳实践

1. **命名规范**
   - 事件常量使用大写蛇形命名：`USER_CREATED`
   - 订阅字段使用驼峰命名：`userCreated`
   - 类型名称使用 PascalCase：`UserCreatedPayload`

2. **错误处理**
   - 在发布事件前确保数据完整性
   - 在订阅解析器中添加适当的错误处理
   - 使用日志记录关键操作

3. **性能考虑**
   - 避免在订阅中发送过大的数据载荷
   - 合理使用过滤器减少不必要的更新
   - 考虑添加订阅超时机制

4. **安全性**
   - 实现适当的认证和授权机制
   - 限制订阅的数量和频率
   - 保护敏感数据

5. **测试**
   - 编写订阅功能的单元测试
   - 测试订阅的连接和断开
   - 验证事件发布和接收

## 常见问题

1. **订阅未触发**
   - 检查事件名称是否匹配
   - 确认 pubsub 实例是否正确共享
   - 验证 WebSocket 连接是否正常

2. **性能问题**
   - 检查订阅数量是否过多
   - 优化数据载荷大小
   - 考虑使用批处理

3. **内存泄漏**
   - 确保正确清理未使用的订阅
   - 实现订阅生命周期管理
   - 监控活动订阅数量 