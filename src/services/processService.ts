import { Server } from 'http';
import logger from '../utils/logger';
import { IProcessManager } from '../interfaces/process';

export class ProcessService implements IProcessManager {
  async cleanup(): Promise<void> {
    // TODO: Add cleanup logic
    // await disconnectDatabase();
    // await disconnectRedis();
    // await cleanupResources();
    logger.info('Resources cleaned up');
  }

  async shutdownServer(server: Server): Promise<void> {
    return new Promise((resolve) => {
      server.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });
  }
} 