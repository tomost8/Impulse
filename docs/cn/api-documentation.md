# Impulse GraphQL API 文档

[English](api-documentation-en.md) | [中文](api-documentation.md)

本文档描述了 Impulse 后端系统的 GraphQL API，包括所有可用的查询、变更和订阅操作。

## API 端点

- **GraphQL 端点**: `http://localhost:3000/graphql`
- **WebSocket 端点**: `ws://localhost:3000/graphql` (用于订阅)

## 认证

API 使用 Firebase 认证系统。客户端需要:

1. 通过 Firebase 获取认证令牌
2. 在每个 GraphQL 请求的 HTTP 头部加入 `Authorization: Bearer <token>`

## 响应格式

所有 API 响应均遵循统一格式:

```typescript
{
  success: boolean;        // 操作是否成功
  <data_field>?: object;   // 请求的数据对象（如 user, post 等）
  errors?: [
    {
      field: string;       // 错误相关字段
      message: string;     // 错误详细信息
    }
  ]
}
```

## 查询操作 (Queries)

### 用户查询

#### `me`: 获取当前认证用户信息

```graphql
query {
  me {
    success
    user {
      id
      email
      first_name
      last_name
      username
      profile_picture
      role
    }
    errors {
      field
      message
    }
  }
}
```

#### `user`: 按 ID 或 Firebase UID 获取用户

```graphql
query {
  user(id: 1) {
    success
    user {
      id
      email
      username
      login_streak {
        streak_count
        weekly_logins
        formatted_weekly_logins {
          label
          completed
        }
      }
    }
    errors {
      field
      message
    }
  }
}
```

#### `users`: 获取用户列表

```graphql
query {
  users(sort_by: POINTS_WEEKLY) {
    success
    users {
      id
      username
      profile_picture
    }
    errors {
      field
      message
    }
  }
}
```

### 社区查询

#### `communities`: 获取社区列表

```graphql
query {
  communities {
    success
    communities {
      id
      name
      description
      thumbnail
      influencer {
        id
        username
      }
    }
    errors {
      field
      message
    }
  }
}
```

#### `community`: 获取单个社区详情

```graphql
query {
  community(id: 1) {
    success
    community {
      id
      name
      description
      code
    }
    errors {
      field
      message
    }
  }
}
```

### 活动查询

#### `activities`: 获取活动列表

```graphql
query {
  activities(userId: 1) {
    success
    activities {
      id
      name
      description
      category
      scheduledDatetime
      status
    }
    errors {
      field
      message
    }
  }
}
```

#### `activity`: 获取单个活动详情

```graphql
query {
  activity(id: 1) {
    success
    activity {
      id
      name
      description
      category
      scheduledDatetime
      status
      userId
    }
    errors {
      field
      message
    }
  }
}
```

### 聊天与消息查询

#### `chats`: 获取用户的聊天列表

```graphql
query {
  chats(userId: 1) {
    success
    chats {
      id
      type
      title
      profile_pic
      created_at
    }
    errors {
      field
      message
    }
  }
}
```

#### `messages`: 获取聊天的消息记录

```graphql
query {
  messages(chatId: 1, limit: 50, offset: 0) {
    success
    messages {
      id
      content
      sender {
        id
        username
        profile_picture
      }
      created_at
      post {
        id
        caption
        mediaUrl
      }
    }
    errors {
      field
      message
    }
  }
}
```

### 帖子查询

#### `posts`: 获取帖子列表

```graphql
query {
  posts(limit: 10, offset: 0) {
    success
    posts {
      id
      caption
      mediaUrl
      author {
        id
        username
        profile_picture
      }
      created_at
      like_count
      post_targets {
        target_type
        target_id
      }
    }
    errors {
      field
      message
    }
  }
}
```

#### `post`: 获取单个帖子详情

```graphql
query {
  post(id: 1) {
    success
    post {
      id
      caption
      mediaUrl
      author {
        id
        username
      }
      created_at
      like_count
      comments {
        id
        content
        user {
          username
          profile_picture
        }
        created_at
      }
    }
    errors {
      field
      message
    }
  }
}
```

## 变更操作 (Mutations)

### 用户变更

#### `firebaseAuth`: Firebase 认证登录/注册

```graphql
mutation {
  firebaseAuth {
    success
    user {
      id
      email
      username
      firebase_uid
      login_streak {
        streak_count
        weekly_logins
      }
    }
    errors {
      field
      message
    }
  }
}
```

#### `updateUser`: 更新用户信息

```graphql
mutation {
  updateUser(input: {
    first_name: "John"
    last_name: "Doe"
    username: "johndoe"
    profile_picture: "https://example.com/profile.jpg"
    bio: "Hello, I'm John!"
    timezone: "Asia/Shanghai"
  }) {
    success
    user {
      id
      username
      profile_picture
      bio
    }
    errors {
      field
      message
    }
  }
}
```

### 活动变更

#### `createActivity`: 创建新活动

```graphql
mutation {
  createActivity(input: {
    name: "Morning Run"
    description: "5km morning run"
    category: "WORKING_OUT"
    duration: 30
    scheduledDatetime: "2023-06-01T06:00:00Z"
  }) {
    success
    activity {
      id
      name
      category
      scheduledDatetime
    }
    errors {
      field
      message
    }
  }
}
```

#### `updateActivity`: 更新活动信息

```graphql
mutation {
  updateActivity(id: 1, input: {
    status: "completed"
  }) {
    success
    activity {
      id
      name
      status
      updatedAt
    }
    errors {
      field
      message
    }
  }
}
```

### 社区变更

#### `createCommunity`: 创建新社区

```graphql
mutation {
  createCommunity(input: {
    name: "Fitness Enthusiasts"
    description: "A community for fitness lovers"
    influencer_id: 1
    thumbnail: "https://example.com/thumbnail.jpg"
    code: "FIT2023"
  }) {
    success
    community {
      id
      name
      code
    }
    errors {
      field
      message
    }
  }
}
```

#### `createCommunityMember`: 添加社区成员

```graphql
mutation {
  createCommunityMember(input: {
    community_id: 1
    user_id: 2
  }) {
    success
    community_member {
      id
      community_id
      user_id
      role
      status
      joined_at
    }
    errors {
      field
      message
    }
  }
}
```

### 聊天与消息变更

#### `createChat`: 创建新聊天

```graphql
mutation {
  createChat(input: {
    type: "group"
    title: "Project Team"
    creator_id: 1
    profile_pic: "https://example.com/group.jpg"
  }) {
    success
    chat {
      id
      title
      type
    }
    errors {
      field
      message
    }
  }
}
```

#### `createMessage`: 发送新消息

```graphql
mutation {
  createMessage(input: {
    chat_id: 1
    sender_id: 1
    content: "Hello everyone!"
  }) {
    success
    message {
      id
      content
      created_at
    }
    errors {
      field
      message
    }
  }
}
```

### 帖子与互动变更

#### `createPost`: 创建新帖子

```graphql
mutation {
  createPost(input: {
    authorId: 1
    caption: "Morning workout complete!"
    mediaUrl: "https://example.com/workout.jpg"
    activityId: 1
    category: "WORKING_OUT"
    post_targets: [
      {
        target_type: "community",
        target_id: 1
      }
    ]
  }) {
    success
    post {
      id
      caption
      created_at
    }
    errors {
      field
      message
    }
  }
}
```

#### `createComment`: 添加评论

```graphql
mutation {
  createComment(input: {
    post_id: 1
    content: "Great job!"
  }) {
    success
    comment {
      id
      content
      created_at
    }
    errors {
      field
      message
    }
  }
}
```

#### `likePost`: 点赞帖子

```graphql
mutation {
  likePost(postId: 1) {
    success
    errors {
      field
      message
    }
  }
}
```

### 通知变更

#### `createReminder`: 创建提醒

```graphql
mutation {
  createReminder(input: {
    title: "Workout Reminder"
    content: "Don't forget your evening workout!"
    type: REMINDER
    recipient_ids: [1]
    schedule_time: "2023-06-01T18:00:00Z"
    schedule_type: DAILY
  })
}
```

#### `sendBroadcastNotification`: 发送广播通知

```graphql
mutation {
  sendBroadcastNotification(input: {
    title: "System Update"
    content: "The app will be updated tonight at 2am"
    type: ADMIN_BROADCAST
    sender_id: 1
  })
}
```

## 订阅操作 (Subscriptions)

### 消息订阅

#### `messageAdded`: 接收新消息通知

```graphql
subscription {
  messageAdded(chatId: 1) {
    id
    content
    sender {
      id
      username
      profile_picture
    }
    created_at
  }
}
```

### 通知订阅

#### `notificationReceived`: 接收新通知

```graphql
subscription {
  notificationReceived(recipientId: 1) {
    id
    title
    content
    type
    sender {
      id
      username
    }
    created_at
  }
}
```

### 活动订阅

#### `activityStatusChanged`: 监听活动状态变更

```graphql
subscription {
  activityStatusChanged(userId: 1) {
    id
    name
    status
    updatedAt
  }
}
```

## 错误处理

API 错误分为以下几类:

1. **验证错误**: 输入数据验证失败
2. **认证错误**: 用户未认证或无权限
3. **资源错误**: 请求的资源不存在
4. **系统错误**: 服务器内部错误

错误信息将通过标准错误格式返回:

```