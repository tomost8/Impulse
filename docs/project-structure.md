# Impulse 后端项目结构文档

## 项目概述

Impulse 是一个基于 Node.js 的全栈应用后端，使用 GraphQL 作为 API 层，Prisma 作为 ORM，PostgreSQL 作为数据库。项目主要功能包括用户管理、社区管理、活动跟踪、即时通讯、通知系统等社交网络核心功能。

## 技术栈

### 核心框架与库

- **Node.js**: 运行时环境 (v20+)
- **TypeScript**: 用于类型安全的代码开发
- **GraphQL**: API 查询语言和运行时
  - **Apollo Server**: GraphQL 服务器实现
  - **Type-GraphQL**: 基于装饰器的 GraphQL schema 定义
- **Prisma**: ORM 工具，用于数据库访问和模型定义
- **PostgreSQL**: 主数据库系统
- **Express**: Web 服务器框架
- **Firebase Admin**: 用于认证和云服务集成
- **Bull**: 后台任务队列系统
- **Redis**: 用于订阅/发布系统和任务队列
- **Winston**: 日志系统

### 开发工具

- **Jest**: 测试框架
- **Nodemon**: 开发时热重载
- **TypeDoc**: 文档生成工具
- **Zod**: 运行时数据验证

## 项目结构

```
Impulse/
├── prisma/                   # Prisma ORM 配置和模型
│   ├── migrations/           # 数据库迁移文件
│   └── schema.prisma         # 数据库模型定义
├── src/                      # 源代码
│   ├── config/               # 配置文件
│   │   ├── env.ts            # 环境变量配置
│   │   ├── firebase.ts       # Firebase 配置
│   │   ├── graphql.ts        # GraphQL 配置
│   │   ├── logger.ts         # 日志配置
│   │   ├── prisma.ts         # Prisma 客户端配置
│   │   ├── pubsub.ts         # 发布/订阅配置
│   │   └── websocket.ts      # WebSocket 配置
│   ├── middleware/           # 中间件
│   ├── modules/              # 功能模块
│   │   ├── activity/         # 活动模块
│   │   ├── chat/             # 聊天模块
│   │   ├── comment/          # 评论模块
│   │   ├── common/           # 共用模块
│   │   ├── community/        # 社区模块
│   │   ├── friendship/       # 好友关系模块
│   │   ├── notification/     # 通知模块
│   │   ├── point/            # 积分模块
│   │   ├── post/             # 帖子模块
│   │   └── user/             # 用户模块
│   │       ├── resolvers/    # GraphQL 解析器
│   │       │   ├── UserQueries.ts     # 查询解析器
│   │       │   ├── UserMutations.ts   # 变更解析器
│   │       │   └── UserSubscriptions.ts # 订阅解析器
│   │       ├── schema/       # GraphQL schema 定义
│   │       └── index.ts      # 模块导出
│   ├── scripts/              # 脚本文件
│   ├── server/               # 服务器相关代码
│   ├── services/             # 服务层
│   │   ├── activityService.ts        # 活动服务
│   │   ├── chatService.ts            # 聊天服务
│   │   ├── commentService.ts         # 评论服务
│   │   ├── communityService.ts       # 社区服务
│   │   ├── friendshipService.ts      # 好友关系服务
│   │   ├── notificationService.ts    # 通知服务
│   │   ├── pointService.ts           # 积分服务
│   │   ├── postService.ts            # 帖子服务
│   │   └── userService.ts            # 用户服务
│   ├── test/                 # 单元测试
│   ├── types/                # 类型定义
│   ├── app.ts                # 应用配置
│   └── index.ts              # 应用入口
├── test/                     # 集成测试
├── logs/                     # 日志文件
├── schema.graphql            # 生成的 GraphQL schema
├── package.json              # 项目依赖配置
├── tsconfig.json             # TypeScript 配置
├── jest.config.js            # Jest 测试配置
└── typedoc.json              # TypeDoc 文档配置
```

## 模块与功能

### 用户模块 (User)
- 用户注册、登录和认证
- 用户个人资料管理
- 用户登录连续性跟踪
- 隐私和安全设置

### 社区模块 (Community)
- 社区创建和管理
- 社区成员管理
- 社区分类
- 社区搜索和发现

### 活动模块 (Activity)
- 活动创建和管理
- 活动日程安排
- 活动分类
- 活动完成状态跟踪

### 帖子模块 (Post)
- 帖子创建和管理
- 媒体内容支持
- 帖子浏览和互动
- 内容到期机制

### 聊天模块 (Chat)
- 一对一和群组聊天
- 消息发送和接收
- 实时通讯
- 聊天成员管理

### 点数模块 (Point)
- 点数累积和消费
- 周期性重置
- 积分统计与排名
- 奖励兑换系统

### 通知模块 (Notification)
- 系统通知
- 社区通知
- 定时提醒
- 通知发送状态管理

### 评论与互动 (Comment & Like)
- 帖子评论
- 内容点赞
- 互动统计

## 代码风格与约定

### 函数命名与组织
- 使用驼峰命名法 (camelCase) 命名函数和变量
- 使用 PascalCase 命名类和接口
- 模块遵循领域驱动设计 (DDD) 原则
- 每个功能模块包含解析器 (resolvers)、模型 (schema) 和服务 (services)

### GraphQL 模式设计
- 使用 Type-GraphQL 装饰器定义 GraphQL 类型
- 查询 (Query)、变更 (Mutation) 和订阅 (Subscription) 清晰分离
- 每个操作返回统一的响应格式，包含：
  - `success`: 操作是否成功
  - 数据载荷 (如 `user`, `post` 等)
  - `errors`: 错误信息数组

### 错误处理
- 使用结构化错误响应
- 集中式日志记录
- 区分开发环境和生产环境的错误显示

### 依赖注入
- 使用 TypeDI 进行依赖注入
- 服务实例通过构造函数注入
- 单例服务模式

## API 文档

GraphQL API 提供以下主要操作类型：

### 查询 (Queries)
用于获取数据的只读操作，如：
- 获取用户信息 (`user`, `users`, `me`)
- 获取社区列表 (`communities`)
- 获取活动记录 (`activities`)
- 获取聊天记录 (`messages`)

### 变更 (Mutations)
用于修改数据的写操作，如：
- 创建/更新/删除用户 (`createUser`, `updateUser`, `deleteUser`)
- 创建/更新/删除帖子 (`createPost`, `updatePost`, `deletePost`)
- 管理好友关系 (`createFriendship`, `updateFriendship`)
- 发送消息 (`createMessage`)

### 订阅 (Subscriptions)
用于实时数据更新的操作，如：
- 新消息通知 (`onNewMessage`)
- 活动状态变更 (`onActivityStatusChanged`)
- 帖子互动更新 (`onPostInteraction`)

## 环境配置

项目使用 `.env` 文件进行环境配置，主要包括：

- 数据库连接 (DATABASE_URL)
- 服务器端口 (PORT)
- Firebase 认证配置
- JWT 令牌配置
- CORS 设置

## 部署与运行

### 开发环境
```bash
npm install
npm run dev
```

### 生产环境
```bash
npm install
npm run build
npm start
```

### 测试
```bash
npm test
```

### 文档生成
```bash
npm run docs
```

## 性能优化

- 使用 Prisma 的关系查询减少 N+1 问题
- GraphQL 批处理请求
- Redis 缓存热点数据
- Bull 队列处理后台任务
- PostgreSQL 索引优化 