import { Service } from 'typedi';
import { Server } from 'http';
import { IProcessManager } from './process.types';
import logger from '../../config/logger';
import { PrismaClient } from '@prisma/client';
import { ErrorService } from '../common/errors/error.service';

@Service()
export class ProcessService implements IProcessManager {
  constructor(
    private prisma: PrismaClient,
    private errorService: ErrorService
  ) {}

  async cleanup(): Promise<void> {
    try {
      // 断开数据库连接
      await this.prisma.$disconnect();
      
      // TODO: 添加其他清理逻辑
      // - Redis 连接
      // - 消息队列连接
      // - 临时文件
      // - 缓存
      
      logger.info('Resources cleaned up successfully');
    } catch (error) {
      logger.error('Error during cleanup:', error);
      throw error;
    }
  }

  async shutdownServer(server: Server): Promise<void> {
    return new Promise((resolve) => {
      server.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });
  }

  setupSignalHandlers(server: Server): void {
    const gracefulShutdown = async (signal: string) => {
      try {
        logger.info(`${signal} signal received: closing HTTP server`);
        await this.cleanup();
        await this.shutdownServer(server);
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // 设置进程错误处理
    process.on('uncaughtException', (error) => {
      this.errorService.handleUncaughtException(error);
      this.cleanup().finally(() => process.exit(1));
    });
    
    process.on('unhandledRejection', (reason) => {
      this.errorService.handleUnhandledRejection(reason);
      this.cleanup().finally(() => process.exit(1));
    });

    // 设置优雅关闭
    ['SIGTERM', 'SIGINT'].forEach((signal) => {
      process.on(signal, () => gracefulShutdown(signal));
    });
  }
} 