import 'reflect-metadata';
import { env } from './config/env';
import { createApp } from './app';
import logger from './config/logger';
import { Container } from 'typedi';
import { ServerLifecycleManagerImpl } from './server/lifecycle';
import { Server } from 'http';

async function bootstrap() {
  try {
    const app = await createApp();
    const lifecycleManager = Container.get(ServerLifecycleManagerImpl);

    const server = await new Promise<Server>((resolve, reject) => {
      const server = app.listen(env.PORT, () => {
        try {
          logger.info(`🚀 Server ready at http://localhost:${env.PORT}`);
          logger.info(`🚀 GraphQL ready at http://localhost:${env.PORT}/graphql`);
          logger.info(`🌍 Environment: ${env.NODE_ENV}`);
          resolve(server);
        } catch (error) {
          reject(error);
        }
      }).on('error', (error) => {
        reject(error);
      });
    });

    // Setup lifecycle management
    lifecycleManager.setupSignalHandlers(server);
  } catch (error) {
    logger.error('Failed to start server:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      port: env.PORT,
      environment: env.NODE_ENV
    });
    process.exit(1);
  }
}

// Handle any unhandled promise rejections in the bootstrap process
bootstrap().catch((error) => {
  logger.error('Fatal error during bootstrap:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    environment: env.NODE_ENV
  });
  process.exit(1);
});