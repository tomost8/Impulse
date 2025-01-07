import { PrismaClient } from '@prisma/client';
import { Container } from 'typedi';

// 创建 Prisma 客户端实例
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 注册到依赖注入容器
Container.set(PrismaClient, prisma);

// 优雅关闭处理
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;