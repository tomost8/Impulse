import logger from '../../utils/logger';

export const setupProcessErrors = () => {
  // handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      processId: process.pid,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    });
    process.exit(1);
  });

  // handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection:', {
      reason,
      stack: reason?.stack,
      timestamp: new Date().toISOString(),
      processId: process.pid,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    });
    process.exit(1);
  });
}; 