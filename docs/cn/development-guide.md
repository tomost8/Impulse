# Impulse 开发指南

本指南为 Impulse 后端项目的开发人员提供设置说明、开发流程、代码规范和最佳实践。

## 环境设置

### 前置条件

确保您的开发环境已安装：

- Node.js v20+ 
- PostgreSQL 14+
- Redis 6+
- Firebase 项目（用于认证）

### 初始化步骤

1. **克隆代码库**

```bash
git clone <repository-url>
cd Impulse
```

2. **安装依赖**

```bash
npm install
```

3. **环境变量配置**

复制环境变量示例文件并填充必要信息：

```bash
cp .env.example .env
```

配置以下必要变量：
- `DATABASE_URL`：PostgreSQL 数据库连接字符串
- `FIREBASE_PROJECT_ID`：Firebase 项目 ID
- `FIREBASE_CLIENT_EMAIL`：Firebase 客户端电子邮件
- `FIREBASE_PRIVATE_KEY`：Firebase 私钥

4. **设置数据库**

```bash
npx prisma migrate dev
```

5. **启动开发服务器**

```bash
npm run dev
```

服务器将在 http://localhost:3000/graphql 启动，提供 GraphQL Playground。

## 项目架构

Impulse 遵循一个模块化的架构，基于领域驱动设计 (DDD) 的原则组织代码：

```
src/
├── modules/    # 领域模块，每个功能区域一个模块
│   ├── user/
│   ├── post/
│   └── ...
├── services/   # 业务逻辑服务
├── config/     # 配置文件
└── middleware/ # Express 中间件
```

### 模块结构

每个功能模块通常包含以下结构：

```
modules/<module-name>/
├── resolvers/  # GraphQL 解析器
│   ├── <Module>Queries.ts
│   ├── <Module>Mutations.ts
│   └── <Module>Subscriptions.ts
├── schema/     # GraphQL 类型定义
│   └── <module>Types.ts
└── index.ts    # 模块导出
```

## 开发工作流

### 特性开发流程

1. **分支管理**

为每个新特性创建一个分支：
```bash
git checkout -b feature/<feature-name>
```

2. **开发新功能**

   a. 在 Prisma schema 中添加数据模型（如需要）
   b. 创建 GraphQL 类型定义
   c. 实现服务层逻辑
   d. 创建 GraphQL 解析器
   e. 编写测试

3. **运行测试**

```bash
npm test
```

4. **提交代码**

```bash
git add .
git commit -m "feat: add <feature-description>"
git push origin feature/<feature-name>
```

5. **创建 Pull Request**

在代码仓库平台上创建一个 Pull Request，详细描述实现的功能和任何必要的上下文。

### 数据库迁移

当需要修改数据库模型时：

1. 更新 `prisma/schema.prisma` 文件
2. 生成迁移
```bash
npx prisma migrate dev --name <migration-name>
```
3. 检查生成的迁移文件
4. 应用迁移
```bash
npx prisma migrate deploy
```

## 代码规范

### TypeScript 规范

- 使用静态类型，避免使用 `any`
- 尽可能使用接口定义数据结构
- 使用异步/等待（async/await）处理异步操作

### GraphQL 规范

#### 类型定义

- 使用 Type-GraphQL 装饰器定义 GraphQL 类型
- 所有类型都应有清晰的注释
- 为所有字段提供明确的类型定义

```typescript
@ObjectType()
class User {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field({ nullable: true })
  profile_picture?: string;
}
```

#### 解析器

- 每个解析器方法应有详细的 JSDoc 注释
- 使用专门的输入类型进行数据验证
- 始终返回包含 `success` 和 `errors` 字段的标准响应

```typescript
@Query(() => UserResponse)
async user(@Arg('id') id: number): Promise<UserResponse> {
  try {
    const user = await this.userService.findById(id);
    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'id',
        message: error.message
      }]
    };
  }
}
```

### 服务层规范

- 业务逻辑应当放在服务层，而不是解析器中
- 使用依赖注入来管理服务依赖
- 每个方法应该有单一职责
- 方法名称应该清晰表达其功能

```typescript
@Service()
class UserService {
  constructor(
    private prisma: PrismaClient,
    private logger: LoggerService
  ) {}

  async findById(id: number): Promise<User> {
    this.logger.info(`Looking up user with ID: ${id}`);
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

## 错误处理最佳实践

### 集中式错误处理

- 使用 `ErrorService` 处理所有 GraphQL 错误
- 对于 HTTP API，使用全局错误中间件
- 记录所有错误，但仅暴露安全的错误信息给客户端

### 标准错误响应

始终使用标准错误格式：

```typescript
{
  success: false,
  errors: [
    {
      field: string;  // 与错误相关的字段
      message: string; // 用户友好的错误消息
    }
  ]
}
```

## 性能优化

### 数据库查询优化

- 使用 Prisma 的 `include` 解决 N+1 问题
- 为频繁查询的字段创建数据库索引
- 复杂查询使用分页减少响应时间

### 缓存策略

- 使用 Redis 缓存频繁访问的数据
- 使用适当的 TTL（生存时间）防止缓存过期
- 实现缓存失效机制

## 日志记录

- 使用 Winston 记录结构化日志
- 使用适当的日志级别（debug、info、warn、error）
- 敏感数据不要记录到日志

```typescript
// 正确的日志记录
logger.info('User login successful', { userId: user.id });

// 错误的日志记录 - 不要记录密码或令牌
logger.info('Auth attempt', { email: 'user@example.com', password: 'secret' });
```

## 测试策略

### 单元测试

使用 Jest 为服务和解析器编写单元测试：

```typescript
describe('UserService', () => {
  it('should find user by ID', async () => {
    const mockPrisma = { user: { findUnique: jest.fn() } };
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, name: 'Test' });
    
    const service = new UserService(mockPrisma as any);
    const result = await service.findById(1);
    
    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(mockPrisma.user.findUnique).toBeCalledWith({ where: { id: 1 } });
  });
});
```

### 集成测试

为 API 端点创建集成测试：

```typescript
describe('User API', () => {
  it('should return user by ID', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          query {
            user(id: 1) {
              success
              user {
                id
                email
              }
            }
          }
        `
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.user.success).toBe(true);
    expect(response.body.data.user.user.id).toBe(1);
  });
});
```

## 安全最佳实践

### 认证与授权

- 使用 Firebase 认证处理用户登录
- 实现基于角色的访问控制
- 使用中间件检查每个请求的权限

### 数据验证

- 使用 Class Validator 或 Zod 验证所有输入
- 实现请求速率限制防止暴力攻击
- 使用 Helmet 设置安全 HTTP 头

### 敏感数据

- 不存储明文密码，使用 Firebase 身份验证
- 加密传输中的敏感数据
- 实现适当的数据访问策略

## API 文档

- 使用 TypeDoc 生成代码文档
- 为所有 GraphQL 类型提供描述
- 使用 JSDoc 注释解释复杂的函数

要生成文档：

```bash
npm run docs
```

生成的文档将位于 `docs/` 目录。

## 贡献指南

1. 在开始工作前确保理解需求
2. 遵循上述代码规范和最佳实践
3. 所有 Pull Request 必须包含测试
4. 保持 commit 历史清晰和有条理

## 疑难解答

### 常见问题

1. **Prisma 连接问题**

   检查数据库 URL 是否正确，并确保数据库服务正在运行：
   ```bash
   npx prisma db seed
   ```

2. **GraphQL 错误**

   检查 schema 定义和解析器是否匹配：
   ```bash
   npm run dev
   ```
   然后在 GraphQL Playground 中使用自省查询检查 schema。

3. **Redis 连接问题**

   确保 Redis 服务正在运行：
   ```bash
   redis-cli ping
   ```
   
4. **TypeScript 编译错误**
   
   运行类型检查：
   ```bash
   npx tsc --noEmit
   ``` 