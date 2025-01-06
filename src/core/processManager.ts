import { Server } from 'http';
import { ProcessService } from '../services/processService';
import { ErrorService } from '../services/errorService';
import logger from '../utils/logger';

export const setupProcessHandlers = (server: Server) => {
  const processService = new ProcessService();
  const errorService = new ErrorService();

  // 设置进程错误处理
  process.on('uncaughtException', (error: Error) => {
    errorService.handleUncaughtException(error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any) => {
    errorService.handleUnhandledRejection(reason);
    process.exit(1);
  });

  // 设置优雅关闭
  const gracefulShutdown = async (signal: string) => {
    try {
      logger.info(`${signal} signal received: closing HTTP server`);
      await processService.cleanup();
      await processService.shutdownServer(server);
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  ['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => gracefulShutdown(signal));
  });
}; 