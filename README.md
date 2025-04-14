# Impulse 后端

Impulse 是一个功能全面的社交网络后端系统，基于 Node.js、GraphQL、Prisma 和 PostgreSQL 构建。

## 功能特性

- 用户管理与身份验证 (Firebase)
- 社区和群组管理
- 即时通讯 (WebSocket)
- 活动跟踪与管理
- 帖子和内容共享
- 点数系统与奖励
- 通知与提醒
- 完整的 GraphQL API

## 技术栈

- **后端**: Node.js, TypeScript, Express
- **API**: GraphQL, Apollo Server, Type-GraphQL
- **数据库**: PostgreSQL, Prisma ORM
- **实时通信**: GraphQL Subscriptions, WebSocket
- **任务队列**: Bull, Redis
- **认证**: Firebase Admin
- **日志**: Winston

## 快速开始

### 前置条件

- Node.js v20+
- PostgreSQL 14+
- Redis 6+
- Firebase 项目

### 安装

1. 克隆项目

```bash
git clone <repository-url>
cd Impulse
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，填写必要的配置信息。

4. 设置数据库

```bash
npx prisma migrate dev
```

5. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 运行，GraphQL Playground 可在 http://localhost:3000/graphql 访问。

## 文档

详细文档请参阅：

- [项目结构](docs/project-structure.md)
- [API 文档](docs/api-documentation.md)
- [开发指南](docs/development-guide.md)

## 开发

### 可用命令

- `npm run dev` - 启动开发服务器
- `npm run build` - 编译 TypeScript
- `npm start` - 启动生产服务器
- `npm test` - 运行测试
- `npm run docs` - 生成文档

### 目录结构

```
Impulse/
├── prisma/                # Prisma ORM 配置
├── src/                   # 源代码
│   ├── modules/           # 功能模块
│   ├── services/          # 业务逻辑服务
│   ├── config/            # 配置文件
│   └── middleware/        # 中间件
├── docs/                  # 文档
└── test/                  # 测试
```

## 贡献

我们欢迎所有形式的贡献！请查看[开发指南](docs/development-guide.md)了解更多信息。

### 贡献步骤

1. Fork 项目仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

本项目采用 [MIT 许可证](LICENSE)。
