import { Server } from 'http';
import logger from '../utils/logger';

export const setupGracefulShutdown = (server: Server) => {
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} signal received: closing HTTP server`);
    
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