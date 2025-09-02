# Impulse GraphQL API Documentation

[English](api-documentation-en.md) | [中文](api-documentation.md)

This document describes the GraphQL API of the Impulse backend system, including all available queries, mutations, and subscription operations.

## API Endpoints

- **GraphQL Endpoint**: `http://localhost:3000/graphql`
- **WebSocket Endpoint**: `ws://localhost:3000/graphql` (for subscriptions)

## Authentication

The API uses Firebase authentication system. Clients need to:

1. Obtain authentication tokens through Firebase
2. Include `Authorization: Bearer <token>` in the HTTP headers of each GraphQL request

## Response Format

All API responses follow a unified format:

```typescript
{
  success: boolean;        // Whether the operation was successful
  <data_field>?: object;   // Requested data object (such as user, post, etc.)
  errors?: [
    {
      field: string;       // Field related to the error
      message: string;     // Detailed error message
    }
  ]
}
```

## Query Operations (Queries)

### User Queries

#### `me`: Get current authenticated user information

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

#### `user`: Get user by ID or Firebase UID

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

#### `users`: Get user list

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

### Community Queries

#### `communities`: Get community list

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

#### `community`: Get single community details

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

### Activity Queries

#### `activities`: Get activity list

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

#### `activity`: Get single activity details

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

### Chat and Message Queries

#### `chats`: Get user's chat list

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

#### `messages`: Get chat message history

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

### Post Queries

#### `posts`: Get post list

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

#### `post`: Get single post details

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

## Mutation Operations (Mutations)

### User Mutations

#### `firebaseAuth`: Firebase authentication login/registration

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

#### `updateUser`: Update user information

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

### Activity Mutations

#### `createActivity`: Create new activity

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

#### `updateActivity`: Update activity information

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

### Community Mutations

#### `createCommunity`: Create new community

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

#### `createCommunityMember`: Add community member

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

### Chat and Message Mutations

#### `createChat`: Create new chat

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

#### `createMessage`: Send new message

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

### Post and Interaction Mutations

#### `createPost`: Create new post

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
        target_type: "community"
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

#### `createComment`: Add comment

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

#### `likePost`: Like post

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

### Notification Mutations

#### `createReminder`: Create reminder

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

#### `sendBroadcastNotification`: Send broadcast notification

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

## Subscription Operations (Subscriptions)

### Message Subscriptions

#### `messageAdded`: Receive new message notifications

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

### Notification Subscriptions

#### `notificationReceived`: Receive new notifications

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

### Activity Subscriptions

#### `activityStatusChanged`: Monitor activity status changes

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

## Error Handling

API errors are categorized into the following types:

1. **Validation Errors**: Input data validation failures
2. **Authentication Errors**: User not authenticated or lacks permissions
3. **Resource Errors**: Requested resource does not exist
4. **System Errors**: Internal server errors

Error information is returned through the standard error format:

```json
{
  "success": false,
  "errors": [
    {
      "field": "name",
      "message": "Name cannot be empty"
    }
  ]
}
```

## Pagination

Queries that support pagination accept the following parameters:

- `limit`: Maximum number of results to return (default: 10)
- `offset`: Starting position in the result set (default: 0)

## Query Optimization

To avoid N+1 query problems, clients should reasonably design query fields and only request the data they need.
