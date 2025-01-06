import { Server } from 'http';
import logger from '../utils/logger';

export const setupGracefulShutdown = (server: Server) => {
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} signal received: closing HTTP server`);
    
    // 这里将来可以添加更多清理工作
    // await disconnectDatabase();
    // await cleanupResources();
    
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  ['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => gracefulShutdown(signal));
  });
}; 